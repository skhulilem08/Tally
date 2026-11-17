/* Audio exists only in this session. No files or background recordings. */
class TallyMicProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0]
    if (channel) this.port.postMessage(channel.slice())
    return true
  }
}
registerProcessor('tally-mic', TallyMicProcessor)
