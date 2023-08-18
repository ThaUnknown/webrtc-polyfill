// @ts-check

/**
 * @class
 * @implements {globalThis.RTCIceTransport}
 */
export default class RTCIceTransport extends EventTarget {
  #component = null
  /** @type {RTCIceGatheringState} */
  #gatheringState = 'new'
  #role = null
  /** @type {RTCIceTransportState} */
  #state = 'new'

  ongatheringstatechange
  onselectedcandidatepairchange
  onstatechange

  get component () {
    return this.#component
  }

  get gatheringState () {
    return this.#gatheringState
  }

  get role () {
    return this.#role
  }

  get state () {
    return this.#state
  }

  getLocalCandidates () {
    /** */
  }

  getLocalParameters () {
    /** */
  }

  getRemoteCandidates () {
    /** */
  }

  getRemoteParameters () {
    /** */
  }

  getSelectedCandidatePair () {
    /** */
  }
}
