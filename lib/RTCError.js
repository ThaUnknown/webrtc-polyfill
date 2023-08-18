// @ts-check
import DOMException from 'node-domexception'

const RTCErrorDetailType = [
  'data-channel-failure',
  'dtls-failure',
  'fingerprint-failure',
  'sctp-failure',
  'sdp-syntax-error',
  'hardware-encoder-not-available',
  'hardware-encoder-error'
]

/**
 * @class
 * @implements {globalThis.RTCError}
 */
export class RTCError extends DOMException {
  #errorDetail
  #sdpLineNumber
  #sctpCauseCode
  #receivedAlert
  #sentAlert
  /**
   * @param {RTCErrorInit} init
   * @param {string=} message
   */
  constructor (init, message) {
    if (arguments.length === 0) throw new TypeError("Failed to construct 'RTCError': 1 argument required, but only 0 present.")
    if (!init.errorDetail) throw new TypeError("Failed to construct 'RTCError': Failed to read the 'errorDetail' property from 'RTCErrorInit': Required member is undefined.")
    if (!RTCErrorDetailType.includes(init.errorDetail)) throw new TypeError(`Failed to construct 'RTCError': Failed to read the 'errorDetail' property from 'RTCErrorInit': The provided value '${init.errorDetail}' is not a valid enum value of type RTCErrorDetailType.`)
    super(message, 'OperationError')

    this.#errorDetail = init.errorDetail

    if (init.errorDetail === 'dtls-failure') {
      this.#receivedAlert = init.receivedAlert || null
      this.#sentAlert = init.sentAlert || null
    }
    if (init.errorDetail === 'sctp-failure') this.#sctpCauseCode = init.sctpCauseCode || null
    if (init.errorDetail === 'sdp-syntax-error') this.#sdpLineNumber = init.sdpLineNumber || null
    if (init.errorDetail === 'sdp-syntax-error') this.#sdpLineNumber = init.sdpLineNumber || null
  }

  get errorDetail () {
    return this.#errorDetail
  }

  get sdpLineNumber () {
    return this.#sdpLineNumber || null
  }

  get sctpCauseCode () {
    return this.#sctpCauseCode || null
  }

  get receivedAlert () {
    return this.#receivedAlert || null
  }

  get sentAlert () {
    return this.#sentAlert || null
  }
}

/**
 * @class
 * @implements {globalThis.RTCErrorEvent}
 */
export class RTCErrorEvent extends Event {
  #error
  /**
   * @param {string} message
   * @param {RTCErrorEventInit} init
   */
  constructor (message, init) {
    if (arguments.length < 2) throw new TypeError(`Failed to construct 'RTCErrorEvent': 2 arguments required, but only ${arguments.length} present.`)
    if (typeof init !== 'object') throw new TypeError("Failed to construct 'RTCErrorEvent': The provided value is not of type 'RTCErrorEventInit'.")
    if (!init.error) throw new TypeError("Failed to construct 'RTCErrorEvent': Failed to read the 'error' property from 'RTCErrorEventInit': Required member is undefined.")
    if (init.error.constructor !== RTCError) throw new TypeError("Failed to construct 'RTCErrorEvent': Failed to read the 'error' property from 'RTCErrorEventInit': Failed to convert value to 'RTCError'.")
    super(message || '')
    this.#error = init.error
  }

  get error () {
    return this.#error
  }
}
