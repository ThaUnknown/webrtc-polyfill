// @ts-check

/**
 * @class
 * @implements {globalThis.RTCSctpTransport}
 */
export default class RTCSctpTransport extends EventTarget {
  #maxChannels = null
  #maxMessageSize
  #state
  #transport

  onstatechange

  get maxChannels () {
    return this.#maxChannels
  }

  get maxMessageSize () {
    return this.#maxMessageSize
  }

  get state () {
    return this.#state
  }

  get transport () {
    return this.#transport
  }
}
