// @ts-check

/**
 * @class
 * @implements {globalThis.RTCSessionDescription}
 */
export default class RTCSessionDescription {
  #type
  #sdp
  /**
   * @param {RTCSessionDescriptionInit | null | undefined | object}  init
   */
  constructor (init) {
    this.#type = init?.type
    this.#sdp = init?.sdp ?? ''
  }

  get type () {
    return this.#type
  }

  get sdp () {
    return this.#sdp
  }

  toJSON () {
    return {
      sdp: this.#sdp,
      type: this.#type
    }
  }
}
