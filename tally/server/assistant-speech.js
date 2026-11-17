import { ReplitConnectors } from '@replit/connectors-sdk'

const connectors = new ReplitConnectors()
let voiceId

async function checked(response) {
  if (!response.ok) {
    const error = new Error(response.status === 401 || response.status === 403
      ? 'The speech connection needs attention. Manual entry is still available.'
      : response.status === 429
        ? 'The speech service has reached its usage limit. Use manual entry or try again later.'
        : 'The speech service could not complete this turn. Try again or use manual entry.')
    error.status = 502
    throw error
  }
  return response
}

export function validateWav(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 48 || bytes.length > 640044 ||
      bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE' ||
      bytes.toString('ascii', 12, 16) !== 'fmt ' || bytes.readUInt32LE(16) !== 16 ||
      bytes.readUInt16LE(20) !== 1 || bytes.readUInt16LE(22) !== 1 ||
      bytes.readUInt32LE(24) !== 16000 || bytes.readUInt32LE(28) !== 32000 ||
      bytes.readUInt16LE(32) !== 2 || bytes.readUInt16LE(34) !== 16 ||
      bytes.toString('ascii', 36, 40) !== 'data' ||
      bytes.readUInt32LE(40) !== bytes.length - 44 ||
      bytes.readUInt32LE(4) !== bytes.length - 8 ||
      bytes.length - 44 < 3200) {
    throw Object.assign(new Error('Speak for between 0.1 and 20 seconds per turn.'), { status: 400 })
  }
}

export async function transcribeSpeech(bytes, signal) {
  validateWav(bytes)
  const form = new FormData()
  form.append('model_id', 'scribe_v2')
  form.append('file', new Blob([bytes], { type: 'audio/wav' }), 'turn.wav')
  form.append('tag_audio_events', 'false')
  form.append('timestamps_granularity', 'none')
  const response = await checked(await connectors.proxy('elevenlabs', '/v1/speech-to-text', {
    method: 'POST', body: form, signal,
  }))
  const data = await response.json()
  if (typeof data.text !== 'string') throw Object.assign(new Error('No transcript was returned. Please try again.'), { status: 502 })
  return { text: data.text.trim().slice(0, 12000) }
}

export async function speakText(text, signal) {
  if (!voiceId) {
    const response = await checked(await connectors.proxy('elevenlabs', '/v1/voices', { signal }))
    const data = await response.json()
    voiceId = data.voices?.find((voice) => voice.category === 'premade')?.voice_id
    if (!voiceId || !/^[a-zA-Z0-9_-]+$/.test(voiceId)) {
      voiceId = null
      throw Object.assign(new Error('No built-in speech voice is available on this connection.'), { status: 502 })
    }
  }
  return checked(await connectors.proxy('elevenlabs', `/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`, {
    method: 'POST', signal,
    body: { text, model_id: 'eleven_multilingual_v2' },
  }))
}
