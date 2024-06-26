import 'node-domexception'
import { RTCErrorEvent, RTCError } from './RTCError.js'
import Blob from './Blob.js'

/**
 * @class
 * @implements {globalThis.RTCDataChannel}
 */
export default class RTCDataChannel extends EventTarget {
  /** @type {import("node-datachannel").DataChannel} dataChannel */
  #dataChannel
  /** @type {RTCDataChannelState} */
  #readyState
  #bufferedAmountLowThreshold
  /** @type {BinaryType} */
  #binaryType = 'blob'
  #maxPacketLifeTime
  #maxRetransmits
  #negotiated
  #ordered
  /** @type {import('./RTCPeerConnection.js').default} */
  #pc

  onbufferedamountlow
  onclose
  onclosing
  onerror
  onmessage
  onopen

  /**
   * @param {import("node-datachannel").DataChannel} dataChannel
   * @param {any} opts
   * @param {import('./RTCPeerConnection.js').default} pc
   */
  constructor (dataChannel, opts = {}, pc) {
    super()

    this.#dataChannel = dataChannel
    this.#readyState = this.#dataChannel.isOpen() ? 'open' : 'connecting'
    this.#bufferedAmountLowThreshold = 0
    this.#maxPacketLifeTime = opts.maxPacketLifeTime ?? null
    this.#maxRetransmits = opts.maxRetransmits ?? null
    this.#negotiated = opts.negotiated ?? false
    this.#ordered = opts.ordered ?? true
    this.#pc = pc

    this.#dataChannel.onOpen(() => {
      this.#readyState = 'open'
      this.dispatchEvent(new Event('open'))
    })

    // we need updated connectionstate, so this is delayed by a single event loop tick
    // this is fucked and wonky, needs to be made better
    this.#dataChannel.onClosed(() => setTimeout(() => {
      if (this.#readyState !== 'closed') {
        // this should be 'disconnected' but ldc doesn't support that
        if (this.#pc.connectionState === 'closed') {
          // if the remote connection suddently closes without closing dc first, throw this weird error
          this.dispatchEvent(new RTCErrorEvent('error', { error: new RTCError({ errorDetail: 'sctp-failure', sctpCauseCode: 12 }, 'User-Initiated Abort, reason=Close called') }))
        }
        this.#readyState = 'closing'
        this.dispatchEvent(new Event('closing'))
        this.#readyState = 'closed'
      }
      this.dispatchEvent(new Event('close'))
    }))

    this.#dataChannel.onError((msg) => {
      this.dispatchEvent(
        new RTCErrorEvent('error', {
          error: new RTCError(
            { errorDetail: 'data-channel-failure' },
            msg
          )
        })
      )
    })

    this.#dataChannel.onBufferedAmountLow(() => {
      this.dispatchEvent(new Event('bufferedamountlow'))
    })

    this.#dataChannel.onMessage(message => {
      /** @type {any} */
      let data
      if (!ArrayBuffer.isView(message)) {
        data = message
      } else if (this.#binaryType === 'blob') {
        data = new Blob([message])
      } else {
        data = message.buffer
      }
      this.dispatchEvent(new MessageEvent('message', { data }))
    })

    // forward events to properties
    this.addEventListener('message', e => {
      this.onmessage?.(e)
    })
    this.addEventListener('bufferedamountlow', e => {
      this.onbufferedamountlow?.(e)
    })
    this.addEventListener('error', e => {
      this.onerror?.(e)
    })
    this.addEventListener('close', e => {
      this.onclose?.(e)
    })
    this.addEventListener('closing', e => {
      this.onclosing?.(e)
    })
    this.addEventListener('open', e => {
      this.onopen?.(e)
    })
  }

  set binaryType (type) {
    if (type !== 'blob' && type !== 'arraybuffer') {
      throw new DOMException(
        "Failed to set the 'binaryType' property on 'RTCDataChannel': Unknown binary type : " + type,
        'TypeMismatchError'
      )
    }
    this.#binaryType = type
  }

  get binaryType () {
    return this.#binaryType
  }

  get bufferedAmount () {
    return this.#dataChannel.bufferedAmount()
  }

  get bufferedAmountLowThreshold () {
    return this.#bufferedAmountLowThreshold
  }

  set bufferedAmountLowThreshold (value) {
    const number = Number(value) || 0
    this.#bufferedAmountLowThreshold = number
    this.#dataChannel.setBufferedAmountLowThreshold(number)
  }

  get id () {
    return this.#dataChannel.getId()
  }

  get label () {
    return this.#dataChannel.getLabel()
  }

  get maxPacketLifeTime () {
    return this.#maxPacketLifeTime
  }

  get maxRetransmits () {
    return this.#maxRetransmits
  }

  get negotiated () {
    return this.#negotiated
  }

  get ordered () {
    return this.#ordered
  }

  get protocol () {
    return this.#dataChannel.getProtocol()
  }

  get readyState () {
    return this.#readyState
  }

  get maxMessageSize () {
    return this.#dataChannel.maxMessageSize()
  }

  /** @param {string | Blob | ArrayBuffer | ArrayBufferView} data */
  send (data) {
    if (this.#readyState !== 'open') {
      throw new DOMException(
        "Failed to execute 'send' on 'RTCDataChannel': RTCDataChannel.readyState is not 'open'",
        'InvalidStateError'
      )
    }

    if (typeof data === 'string') {
      if (data.length > this.#dataChannel.maxMessageSize()) throw new TypeError('Max message size exceeded.')
      this.#dataChannel.sendMessage(data)
    } else if ('arrayBuffer' in data) {
      if (data.size > this.#dataChannel.maxMessageSize()) throw new TypeError('Max message size exceeded.')
      return data.arrayBuffer().then(ab => {
        if (this.readyState === 'open') this.#dataChannel.sendMessageBinary(new Uint8Array(ab))
      })
    } else {
      if (data.byteLength > this.#dataChannel.maxMessageSize()) throw new TypeError('Max message size exceeded.')
      // if (ArrayBuffer.isView(data)) data = data.buffer
      // @ts-ignore - NDC doesn't like transfering raw buffers, so we need to clone
      this.#dataChannel.sendMessageBinary(new Uint8Array(data))
    }
  }

  close () {
    this.#readyState = 'closed'
    setTimeout(() => {
      if (this.#pc.connectionState === 'closed') {
        // if the remote connection suddently closes without closing dc first, throw this weird error
        // can this be done better?
        this.dispatchEvent(new RTCErrorEvent('error', { error: new RTCError({ errorDetail: 'sctp-failure', sctpCauseCode: 12 }, 'User-Initiated Abort, reason=Close called') }))
      }
    })

    this.#dataChannel.close()
  }
}
