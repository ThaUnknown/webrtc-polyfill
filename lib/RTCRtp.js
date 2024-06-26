import 'node-domexception'
import RTCDtlsTransport from './RTCDtlsTransport.js'

const ndcDirectionMapFrom = {
  Inactive: 'inactive',
  RecvOnly: 'recvonly',
  SendOnly: 'sendonly',
  SendRecv: 'sendrecv',
  Unknown: 'undefined'
}

const ndcDirectionMapTo = {
  inactive: 'Inactive',
  recvonly: 'RecvOnly',
  sendonly: 'SendOnly',
  sendrecv: 'SendRecv',
  stopped: 'Inactive',
  undefined: 'Unknown'
}

/**
 * @class
 * @implements {globalThis.RTCRtpTransceiver}
 */
export class RTCRtpTransceiver {
  #transceiver
  #track
  #desiredDirection
  #sender
  #receiver
  constructor ({ transceiver, pc }) {
    this.#transceiver = transceiver
    this.#sender = new RTCRtpSender({ pc })
    this.#receiver = new RTCRtpReceiver({ pc })
  }

  _setNDCTrack (track) {
    if (this.#track) return
    this.#track = track
  }

  get currentDirection () {
    return ndcDirectionMapFrom[this.#transceiver.direction()]
  }

  get direction () {
    return this.#desiredDirection
  }

  set direction (dir) {
    this.#desiredDirection = dir
    if (!this.#sender) return
    this.#transceiver.setDirection(ndcDirectionMapTo[dir])
  }

  get mid () {
    return this.#transceiver.mid()
  }

  get sender () {
    return this.#sender
  }

  get receiver () {
    return this.#receiver
  }

  get stopped () {
    return this.#track?.isClosed()
  }

  setDirection (direction) {
    this.#track?.setDirection(ndcDirectionMapTo[direction])
  }

  setCodecPreferences (codecs) {
    // TODO
    // addVideoCodec(payloadType: number, codec: string, profile?: string): void;
    // addH264Codec(payloadType: number, profile?: string): void;
    // addVP8Codec(payloadType: number): void;
    // addVP9Codec(payloadType: number): void;
  }

  stop () {
    this.#track?.close()
  }
}

/**
 * @class
 * @implements {globalThis.RTCRtpSender}
 */
export class RTCRtpSender {
  track
  transform // TODO, is it worth tho?
  #transport
  #pc
  constructor ({ pc }) {
    this.#transport = new RTCDtlsTransport({ pc })
    this.#pc = pc
  }

  get dtmf () {
    return null
  }

  get transport () {
    return this.#transport ?? null
  }

  static getCapabilities (kind) {
    if (!kind) throw new TypeError("Failed to execute 'getCapabilities' on 'RTCRtpSender': 1 argument required, but only 0 present.")
    if (kind === 'video') {
      return {
        codecs: [
          { mimeType: 'video/H264' },
          { mimeType: 'video/VP8' },
          { mimeType: 'video/VP9' }
        ]
      }
    } else {
      return {
        codecs: [
          { mimeType: 'video/opus' }
        ]
      }
    }
  }

  async getStats () {
    return new Map()
  }

  getParameters () {
    return { encodings: [], codecs: [], transactionId: '', headerExtensions: [], rtcp: { reducedSize: false } }
  }

  async setParameters () {
    // TODO
    // addVideoCodec(payloadType: number, codec: string, profile?: string): void;
    // addH264Codec(payloadType: number, profile?: string): void;
    // addVP8Codec(payloadType: number): void;
    // addVP9Codec(payloadType: number): void;
    // setBitrate
  }

  setStreams (streams) {
    if (this.#pc.connectionState !== 'connected') throw new DOMException('Sender\'s connection is closed', 'InvalidStateError')
    if (!this.track) return
    for (const stream of streams) {
      stream.addTrack(this.track)
    }
  }

  async replaceTrack () {
    throw new TypeError('Method unsupported')
  }
}

/**
 * @class
 * @implements {globalThis.RTCRtpReceiver}
 */
export class RTCRtpReceiver {
  transform // TODO, is it worth tho?
  #transport
  track
  constructor ({ pc }) {
    this.#transport = new RTCDtlsTransport({ pc })
  }

  get transport () {
    return this.#transport ?? null
  }

  static getCapabilities (kind) {
    if (!kind) throw new TypeError("Failed to execute 'getCapabilities' on 'RTCRtpSender': 1 argument required, but only 0 present.")
    if (kind === 'video') {
      return {
        codecs: [
          { mimeType: 'video/H264' },
          { mimeType: 'video/VP8' },
          { mimeType: 'video/VP9' }
        ]
      }
    } else {
      return {
        codecs: [
          { mimeType: 'video/opus' }
        ]
      }
    }
  }

  async getStats () {
    return new Map()
  }

  getParameters () {
    return { encodings: [], codecs: [], transactionId: '', headerExtensions: [], rtcp: { reducedSize: false } }
  }

  getContributingSources () {
    return []
  }

  getSynchronizationSources () {
    return []
  }
}
