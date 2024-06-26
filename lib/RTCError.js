import 'node-domexception'

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
  #httpRequestStatusCode
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

    this.#receivedAlert = init.receivedAlert ?? null
    this.#sentAlert = init.sentAlert ?? null
    this.#sctpCauseCode = init.sctpCauseCode ?? null
    this.#sdpLineNumber = init.sdpLineNumber ?? null
    this.#httpRequestStatusCode = init.httpRequestStatusCode ?? null
  }

  get errorDetail () {
    return this.#errorDetail
  }

  get sdpLineNumber () {
    return this.#sdpLineNumber ?? null
  }

  get sctpCauseCode () {
    return this.#sctpCauseCode ?? null
  }

  get receivedAlert () {
    return this.#receivedAlert ?? null
  }

  get sentAlert () {
    return this.#sentAlert ?? null
  }

  get httpRequestStatusCode () {
    return this.#httpRequestStatusCode ?? null
  }

  set errorDetail (_) {
    throw new TypeError('RTCError.errorDetail is readonly.')
  }

  set sdpLineNumber (_) {
    throw new TypeError('RTCError.sdpLineNumber is readonly.')
  }

  set sctpCauseCode (_) {
    throw new TypeError('RTCError.sctpCauseCode is readonly.')
  }

  set receivedAlert (_) {
    throw new TypeError('RTCError.receivedAlert is readonly.')
  }

  set sentAlert (_) {
    throw new TypeError('RTCError.sentAlert is readonly.')
  }

  set httpRequestStatusCode (_) {
    throw new TypeError('RTCError.httpRequestStatusCode is readonly.')
  }
}

/**
 * @class
 * @implements {globalThis.RTCErrorEvent}
 */
export class RTCErrorEvent extends Event {
  #error
  /**
   * @param {string} type
   * @param {RTCErrorEventInit} init
   */
  constructor (type, init) {
    if (arguments.length < 2) throw new TypeError(`Failed to construct 'RTCErrorEvent': 2 arguments required, but only ${arguments.length} present.`)
    if (typeof init !== 'object') throw new TypeError("Failed to construct 'RTCErrorEvent': The provided value is not of type 'RTCErrorEventInit'.")
    if (!init.error) throw new TypeError("Failed to construct 'RTCErrorEvent': Failed to read the 'error' property from 'RTCErrorEventInit': Required member is undefined.")
    if (init.error.constructor !== RTCError) throw new TypeError("Failed to construct 'RTCErrorEvent': Failed to read the 'error' property from 'RTCErrorEventInit': Failed to convert value to 'RTCError'.")
    super(type || 'error')
    this.#error = init.error
  }

  get error () {
    return this.#error
  }
}
