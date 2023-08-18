// @ts-check
import DOMException from 'node-domexception'

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
    if (!init || !init.type) {
      throw new DOMException('Type and sdp properties are required.')
    }

    this.#type = init?.type
    this.#sdp = init?.sdp || ''
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
