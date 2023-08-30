// @ts-check
import RTCDtlsTransport from './RTCDtlsTransport.js'

/**
 * @class
 * @implements {globalThis.RTCSctpTransport}
 */
export default class RTCSctpTransport extends EventTarget {
  #maxChannels = null
  /** @type {import('./RTCPeerConnection.js').default} */
  #pc
  #transport

  onstatechange
  onerror

  constructor ({ pc }) {
    super()
    this.#pc = pc
    this.#transport = new RTCDtlsTransport({ pc })

    pc.addEventListener('connectionstatechange', () => {
      const e = new Event('statechange')
      this.dispatchEvent(e)
      this.onstatechange?.(e)
    })
  }

  get maxChannels () {
    return this.#maxChannels
  }

  get maxMessageSize () {
    return this.#pc.maxMessageSize
  }

  get state () {
    // TODO: this isn't accurate ¯\_(ツ)_/¯
    if (this.#pc.connectionState === 'disconnected' || this.#pc.connectionState === 'failed') return 'closed'
    if (this.#pc.connectionState === 'new') return 'connecting'
    return this.#pc.connectionState
  }

  get transport () {
    return this.#transport
  }
}
