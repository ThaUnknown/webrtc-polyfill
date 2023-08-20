// @ts-check

/**
 * @class
 * @implements {globalThis.RTCPeerConnectionIceEvent}
 */
export class RTCPeerConnectionIceEvent extends Event {
  #candidate

  constructor (candidate) {
    super('icecandidate')

    this.#candidate = candidate
  }

  get candidate () {
    return this.#candidate
  }
}
/**
 * @class
 * @implements {globalThis.RTCDataChannelEvent}
 */
export class RTCDataChannelEvent extends Event {
  #channel

  constructor (channel) {
    super('datachannel')

    this.#channel = channel
  }

  get channel () {
    return this.#channel
  }
}
/**
 * @class
 * @implements {globalThis.RTCTrackEvent}
 */
export class RTCTrackEvent extends Event {
  #track
  #receiver
  #transceiver

  constructor ({ track, receiver, transceiver }) {
    super('track')

    this.#track = track
    this.#receiver = receiver
    this.#transceiver = transceiver
  }

  get track () {
    return this.#track
  }

  get receiver () {
    return this.#receiver
  }

  get transceiver () {
    return this.#transceiver
  }

  get streams () {
    return []
  }
}
