// @ts-check

/**
 * @class
 * @implements {globalThis.RTCIceTransport}
 */
export default class RTCIceTransport extends EventTarget {
  #component = null
  #role = null
  /** @type {import('./RTCPeerConnection.js').default} */
  #pc

  ongatheringstatechange
  // TODO: not implemented
  onselectedcandidatepairchange
  onstatechange

  constructor ({ pc }) {
    super()
    this.#pc = pc

    pc.addEventListener('icegatheringstatechange', () => {
      const e = new Event('gatheringstatechange')
      this.dispatchEvent(e)
      this.ongatheringstatechange?.(e)
    })
    pc.addEventListener('iceconnectionstatechange', () => {
      const e = new Event('statechange')
      this.dispatchEvent(e)
      this.onstatechange?.(e)
    })
  }

  get component () {
    // TODO: how?
    return this.#component
  }

  get role () {
    // TODO: hmmm how?
    return this.#role
  }

  get gatheringState () {
    return this.#pc.iceGatheringState
  }

  get state () {
    return this.#pc.iceConnectionState
  }

  getLocalCandidates () {
    return this.#pc.localCandidates
  }

  getRemoteCandidates () {
    return this.#pc.remoteCandidates
  }

  getLocalParameters () {
    // TODO: not according to spec, needs to me transformed
    return this.#pc.localDescription
  }

  getRemoteParameters () {
    // TODO: not according to spec, needs to me transformed
    return this.#pc.remoteDescription
  }

  getSelectedCandidatePair () {
    /** @type {RTCIceCandidatePair} */
    const x = this.#pc.getSelectedCandidatePair()
    return x
  }
}
