// @ts-check

/**
 * @class
 * @implements {globalThis.RTCDtlsTransport}
 */
export default class RTCDtlsTransport extends EventTarget {
  #iceTransport
  #state

  onerror
  onstatechange

  get iceTransport () {
    return this.#iceTransport
  }

  get state () {
    return this.#state
  }

  getRemoteCertificates () {
    /** */
  }
}
