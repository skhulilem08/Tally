import { useEffect, useRef, useState } from 'react'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')
export function speechWav(chunks, sampleRate) {
  const length = chunks.reduce((n, chunk) => n + chunk.length, 0)
  const source = new Float32Array(length)
  let offset = 0
  for (const chunk of chunks) { source.set(chunk, offset); offset += chunk.length }
  const count = Math.min(320000, Math.floor(length * 16000 / sampleRate))
  const buffer = new ArrayBuffer(44 + count * 2)
  const view = new DataView(buffer)
  const text = (at, word) => [...word].forEach((letter, i) => view.setUint8(at + i, letter.charCodeAt(0)))
  text(0, 'RIFF'); view.setUint32(4, 36 + count * 2, true); text(8, 'WAVE')
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, 1, true); view.setUint32(24, 16000, true)
  view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  text(36, 'data'); view.setUint32(40, count * 2, true)
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * sampleRate / 16000)
    const end = Math.min(length, Math.max(start + 1, Math.floor((i + 1) * sampleRate / 16000)))
    let value = 0
    for (let j = start; j < end; j++) value += source[j]
    value = Math.max(-1, Math.min(1, value / (end - start)))
    view.setInt16(44 + i * 2, value * (value < 0 ? 32768 : 32767), true)
  }
  return buffer
}

export function useVoiceCall({ onTranscript, onInterrupt, scope }) {
  const [view, setView] = useState({ active: false, muted: false, status: 'idle', error: '' })
  const session = useRef(null)
  const callbacks = useRef({ onTranscript, onInterrupt })
  callbacks.current = { onTranscript, onInterrupt }
  const update = (call, patch) => {
    if (session.current !== call) return
    Object.assign(call, patch)
    setView((value) => ({ ...value, ...patch }))
  }
  function stopPlayback(call) {
    if (call.player) { try { call.player.stop() } catch { /* already ended */ }; call.player = null }
    call.abort?.abort()
    call.abort = null
  }
  function interrupt() {
    const call = session.current
    if (!call) return
    call.turn += 1
    stopPlayback(call)
    callbacks.current.onInterrupt()
    call.waiting = false
    update(call, { status: call.muted ? 'muted' : 'listening' })
  }
  function end() {
    const call = session.current
    session.current = null
    if (call) {
      call.turn++
      clearTimeout(call.timeout)
      stopPlayback(call)
      call.stream?.getTracks().forEach((track) => track.stop())
      call.node?.disconnect()
      call.source?.disconnect()
      call.silent?.disconnect()
      void call.context?.close()
      callbacks.current.onInterrupt()
    }
    setView({ active: false, muted: false, status: 'idle', error: '' })
  }
  async function transcribeTurn(call, chunks, correctedText, correctionId) {
    const turn = ++call.turn
    call.waiting = true
    const abort = new AbortController()
    call.abort = abort
    const timeout = setTimeout(() => abort.abort(), 45000)
    update(call, { status: 'transcribing' })
    try {
      let transcript = { text: correctedText }
      if (correctedText === undefined) {
        const response = await fetch(`${base}/api/assistant/transcribe`, {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'audio/wav' },
          body: speechWav(chunks, call.context.sampleRate), signal: abort.signal,
        })
        transcript = await response.json()
        if (!response.ok) throw new Error(transcript.error || 'Could not recognize this turn.')
      }
      if (session.current !== call || turn !== call.turn) return
      clearTimeout(timeout)
      if (!transcript.text) { update(call, { status: 'listening' }); return }
      update(call, { status: 'thinking' })
      const reply = await callbacks.current.onTranscript(transcript.text, correctionId)
      if (session.current !== call || turn !== call.turn || !reply) return
      const speechAbort = new AbortController()
      call.abort = speechAbort
      const speechTimeout = setTimeout(() => speechAbort.abort(), 45000)
      let audio
      try {
        const spoken = await fetch(`${base}/api/assistant/speak`, {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: reply.slice(0, 2200) }), signal: speechAbort.signal,
        })
        if (!spoken.ok) throw new Error((await spoken.json()).error || 'Voice playback failed. The reply is still visible below.')
        audio = await call.context.decodeAudioData(await spoken.arrayBuffer())
      } finally { clearTimeout(speechTimeout) }
      if (session.current !== call || turn !== call.turn) return
      await call.context.resume()
      const source = call.context.createBufferSource()
      source.buffer = audio
      source.connect(call.context.destination)
      call.player = source
      update(call, { status: 'speaking' })
      await new Promise((resolve) => { source.onended = resolve; source.start() })
      if (session.current === call && turn === call.turn) {
        call.player = null
        update(call, { status: call.muted ? 'muted' : 'listening' })
      }
    } catch (error) {
      if (session.current === call && turn === call.turn) {
        update(call, { status: call.muted ? 'muted' : 'listening', error: error.name === 'AbortError' ? 'This speech turn timed out. Try again or use manual entry.' : error.message })
      }
      if (correctedText !== undefined) throw error
    } finally {
      clearTimeout(timeout)
      if (session.current === call && turn === call.turn) call.waiting = false
    }
  }
  async function start() {
    if (session.current) return
    const call = { turn: 0, muted: false, waiting: false, status: 'requesting', chunks: [], pre: [], speech: 0, silence: 0, elapsed: 0 }
    session.current = call
    setView({ active: true, muted: false, status: 'requesting', error: '' })
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.AudioWorkletNode) throw new Error('Voice calling is unavailable in this browser. Use manual entry.')
      // Resume from the explicit user gesture for iOS playback permission.
      call.context = new AudioContext()
      await call.context.resume()
      call.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false })
      if (session.current !== call) { call.stream.getTracks().forEach((track) => track.stop()); return }
      await call.context.audioWorklet.addModule(`${base}/tally-mic-worklet.js`)
      if (session.current !== call) return
      call.source = call.context.createMediaStreamSource(call.stream)
      call.node = new AudioWorkletNode(call.context, 'tally-mic')
      call.silent = call.context.createGain()
      call.silent.gain.value = 0
      call.source.connect(call.node).connect(call.silent).connect(call.context.destination)
      call.node.port.onmessage = ({ data }) => {
        if (session.current !== call || call.muted) return
        const duration = data.length / call.context.sampleRate
        const rms = Math.sqrt(data.reduce((n, sample) => n + sample * sample, 0) / data.length)
        const speaking = rms > 0.025
        // Continuous capture, automatic speech turns; no record/send gesture.
        if (!call.speech) {
          call.pre.push(data)
          while (call.pre.reduce((n, chunk) => n + chunk.length, 0) > call.context.sampleRate * 0.25) call.pre.shift()
          call.onset = speaking ? (call.onset || 0) + duration : 0
          if (call.onset < 0.16) return
          if (call.waiting || call.player) interrupt()
          call.chunks = [...call.pre]
          call.pre = []
          call.speech = duration
          call.elapsed = 0.25
          call.silence = 0
          update(call, { status: 'listening', error: '' })
        } else {
          call.chunks.push(data)
          call.elapsed += duration
          if (speaking) { call.speech += duration; call.silence = 0 }
          else call.silence += duration
          if (call.silence > 0.9 || call.elapsed >= 19.5) {
            const chunks = call.chunks
            const enough = call.speech > 0.2
            call.speech = 0; call.chunks = []; call.onset = 0; call.pre = []
            if (enough) void transcribeTurn(call, chunks)
          }
        }
      }
      call.stream.getAudioTracks()[0].onended = () => {
        if (session.current === call) { end(); setView((value) => ({ ...value, status: 'error', error: 'Microphone access ended. Start the call again or use manual entry.' })) }
      }
      call.context.onstatechange = () => {
        if (session.current === call && call.context.state === 'suspended') {
          end()
          setView((value) => ({ ...value, status: 'error', error: 'Audio was suspended. Start again to resume.' }))
        }
      }
      call.timeout = setTimeout(end, 15 * 60000)
      update(call, { status: 'listening' })
    } catch (error) {
      if (session.current === call) {
        end()
        setView({ active: false, muted: false, status: 'error', error: error.name === 'NotAllowedError' ? 'Allow microphone access to start a call. Manual entry is still available.' : error.message })
      }
    }
  }
  function toggleMute() {
    const call = session.current
    if (!call) return
    const muted = !call.muted
    call.stream?.getAudioTracks().forEach((track) => { track.enabled = !muted })
    call.speech = 0; call.chunks = []; call.pre = []; call.onset = 0
    update(call, { muted, status: muted ? 'muted' : call.player ? 'speaking' : call.waiting ? 'thinking' : 'listening' })
  }
  useEffect(() => {
    const hidden = () => { if (document.hidden) end() }
    document.addEventListener('visibilitychange', hidden)
    return () => { document.removeEventListener('visibilitychange', hidden); end() }
    // Call lifecycle is scoped to the kitchen owner; callbacks use latest refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])
  async function correct(text, correctionId) {
    const call = session.current
    if (!call) return ''
    interrupt()
    return transcribeTurn(call, null, text, correctionId)
  }
  return { ...view, start, end, toggleMute, interrupt, correct }
}
