// @ts-check

/**
 * @class
 * @implements {globalThis.RTCDtlsTransport}
 */
export default class RTCDtlsTransport extends EventTarget {
  #iceTransport
  /** @type {import('./RTCPeerConnection.js').default} */
  #pc

  onerror
  onstatechange

  constructor ({ transceiver, pc }) {
    super()
    this.#pc = pc
  }

  get iceTransport () {
    return this.#iceTransport
  }

  get state () {
    // TODO: this isn't accurate ¯\_(ツ)_/¯
    if (this.#pc.connectionState === 'disconnected') return 'failed'
    return this.#pc.connectionState
  }

  getRemoteCertificates () {
    // not supported by all browsers anyways
    return [new ArrayBuffer(0)]
  }
}
