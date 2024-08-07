import { PeerConnection, RtcpReceivingSession, Video, Audio } from 'node-datachannel'
import 'node-domexception'
import RTCSessionDescription from './RTCSessionDescription.js'
import RTCDataChannel from './RTCDataChannel.js'
import RTCIceCandidate from './RTCIceCandidate.js'
import { RTCDataChannelEvent, RTCPeerConnectionIceEvent, RTCTrackEvent } from './Events.js'
import { RTCRtpTransceiver } from './RTCRtp.js'
import { MediaStreamTrack } from './MediaStream.js'
import RTCSctpTransport from './RTCSctpTransport.js'

const ndcDirectionMap = {
  inactive: 'Inactive',
  recvonly: 'RecvOnly',
  sendonly: 'SendOnly',
  sendrecv: 'SendRecv',
  stopped: 'Inactive',
  undefined: 'Unknown'
}

/**
 * @class
 * @implements {globalThis.RTCPeerConnection}
 */
export default class RTCPeerConnection extends EventTarget {
  #peerConnection
  #localOffer
  #localAnswer
  /** @type {Set<RTCDataChannel>} */
  #dataChannels = new Set()
  #config
  #canTrickleIceCandidates = null
  #sctp
  /** @type {RTCIceCandidate[]} */
  #localCandidates = []
  /** @type {RTCIceCandidate[]} */
  #remoteCandidates = []
  #announceNegotiation

  #tracks = new Set()
  #transceivers = []
  #unusedTransceivers = []

  onconnectionstatechange
  ondatachannel
  onicecandidate
  // TODO: not implemented
  onicecandidateerror
  oniceconnectionstatechange
  onicegatheringstatechange
  onnegotiationneeded
  onsignalingstatechange
  ontrack

  constructor (init = {}) {
    super()

    this.setConfiguration(init)
    this.#localOffer = createDeferredPromise()
    this.#localAnswer = createDeferredPromise()
    this.#sctp = new RTCSctpTransport({ pc: this })

    this.#peerConnection = new PeerConnection(this.#config.peerIdentity || `peer-${getRandomString(7)}`, {
      ...init,
      iceServers: this.#config.iceServers
        .map(server => {
          const urls = Array.isArray(server.urls) ? server.urls : [server.urls]

          return urls.map(url => {
            if (server.username && server.credential) {
              const [protocol, rest] = url.split(/:(.*)/)
              return `${protocol}:${server.username}:${server.credential}@${rest}`
            }
            return url
          })
        })
        .flat(),
      iceTransportPolicy: this.#config.iceTransportPolicy
    })

    // forward peerConnection events
    this.#peerConnection.onStateChange(() => {
      this.dispatchEvent(new Event('connectionstatechange'))
    })

    this.#peerConnection.onIceStateChange(() => {
      this.dispatchEvent(new Event('iceconnectionstatechange'))
    })

    this.#peerConnection.onSignalingStateChange(() => {
      this.dispatchEvent(new Event('signalingstatechange'))
    })

    this.#peerConnection.onGatheringStateChange(() => {
      this.dispatchEvent(new Event('icegatheringstatechange'))
    })

    this.#peerConnection.onDataChannel(dataChannel => {
      this.dispatchEvent(new RTCDataChannelEvent('datachannel', { channel: this.#handleDataChannel(dataChannel) }))
    })

    this.#peerConnection.onLocalDescription((sdp, type) => {
      if (type === 'offer') {
        this.#localOffer.resolve(new RTCSessionDescription({ sdp, type }))
      }

      if (type === 'answer') {
        this.#localAnswer.resolve(new RTCSessionDescription({ sdp, type }))
      }
    })

    this.#peerConnection.onLocalCandidate((candidate, sdpMid) => {
      if (sdpMid === 'unspec') {
        this.#localAnswer.reject(new Error(`Invalid description type ${sdpMid}`))
        return
      }

      this.dispatchEvent(new RTCPeerConnectionIceEvent(new RTCIceCandidate({ candidate, sdpMid })))
    })

    this.#peerConnection.onTrack(track => {
      const transceiver = new RTCRtpTransceiver({ transceiver: track, pc: this })
      this.#tracks.add(track)
      transceiver._setNDCTrack(track)
      this.#transceivers.push(transceiver)
      const mediastream = new MediaStreamTrack()
      mediastream.track = track
      track.onClosed(() => {
        this.#tracks.delete(track)
        mediastream.dispatchEvent(new Event('ended'))
      })
      track.onMessage(buf => mediastream.stream.push(buf))
      transceiver.receiver.track = mediastream
      this.dispatchEvent(new RTCTrackEvent('track', { track: mediastream, receiver: transceiver.receiver, transceiver }))
    })

    // forward events to properties
    this.addEventListener('connectionstatechange', e => {
      this.onconnectionstatechange?.(e)
    })
    this.addEventListener('signalingstatechange', e => {
      this.onsignalingstatechange?.(e)
    })
    this.addEventListener('iceconnectionstatechange', e => {
      this.oniceconnectionstatechange?.(e)
    })
    this.addEventListener('icegatheringstatechange', e => {
      this.onicegatheringstatechange?.(e)
    })
    this.addEventListener('datachannel', e => {
      this.ondatachannel?.(e)
    })
    this.addEventListener('icecandidate', e => {
      // @ts-ignore
      this.#localCandidates.push(e.candidate)
      this.onicecandidate?.(e)
    })
    this.addEventListener('track', e => {
      this.ontrack?.(e)
    })
    this.addEventListener('negotiationneeded', e => {
      this.#announceNegotiation = true
      this.onnegotiationneeded?.(e)
    })
  }

  get localCandidates () {
    return this.#localCandidates
  }

  get remoteCandidates () {
    return this.#remoteCandidates
  }

  get canTrickleIceCandidates () {
    return this.#canTrickleIceCandidates
  }

  get connectionState () {
    return this.#peerConnection.state()
  }

  get iceConnectionState () {
    const state = this.#peerConnection.iceState()
    if (state === 'completed') return 'connected'
    return state
  }

  get iceGatheringState () {
    return this.#peerConnection.gatheringState()
  }

  /** @param {{ type: string; sdp: string; } | null} desc */
  #nullableDescription (desc) {
    if (!desc) return null
    return new RTCSessionDescription(desc)
  }

  get currentLocalDescription () {
    return this.#nullableDescription(this.#peerConnection.localDescription())
  }

  get currentRemoteDescription () {
    return this.#nullableDescription(this.#peerConnection.remoteDescription())
  }

  get localDescription () {
    return this.#nullableDescription(this.#peerConnection.localDescription())
  }

  get pendingLocalDescription () {
    return this.#nullableDescription(this.#peerConnection.localDescription())
  }

  get pendingRemoteDescription () {
    return this.#nullableDescription(this.#peerConnection.remoteDescription())
  }

  get remoteDescription () {
    return this.#nullableDescription(this.#peerConnection.remoteDescription())
  }

  get sctp () {
    return this.#sctp
  }

  get signalingState () {
    return this.#peerConnection.signalingState()
  }

  /** @type {typeof globalThis.RTCPeerConnection['generateCertificate']} */
  static async generateCertificate (keygenAlgorithm) {
    throw new DOMException('Not implemented')
  }

  /** @param {RTCIceCandidateInit} candidate */
  async addIceCandidate (candidate) {
    // TODO: only resolve this once the candidate is added
    if (candidate?.candidate == null) {
      throw new DOMException('Candidate invalid')
    }

    // re-throw as w3c errors
    try {
      this.#peerConnection.addRemoteCandidate(candidate.candidate, candidate.sdpMid ?? '0')
      this.#remoteCandidates.push(new RTCIceCandidate(candidate))
    } catch (e) {
      if (!e?.message) throw new DOMException(JSON.stringify(e), 'UnknownError')

      const { message } = e
      if (message.includes('remote candidate without remote description')) throw new DOMException(message, 'InvalidStateError')
      if (message.includes('Invalid candidate format')) throw new DOMException(message, 'OperationError')

      throw new DOMException(message, 'UnknownError')
    }
  }

  #findUnusedTransceiver (kind) {
    const unused = this.#unusedTransceivers.find(tr => tr.track.kind === kind && tr.direction === 'sendonly')
    if (!unused) return
    this.#unusedTransceivers.splice(this.#unusedTransceivers.indexOf(unused), 1)
    return unused
  }

  #setUpTrack (media, track, transceiver, direction) {
    const session = new RtcpReceivingSession()
    const pctrack = this.#peerConnection.addTrack(media)
    this.#tracks.add(pctrack)
    pctrack.onClosed(() => {
      this.#tracks.delete(pctrack)
      track.dispatchEvent(new Event('ended'))
    })
    pctrack.setMediaHandler(session)
    track.media = media
    track.track = pctrack
    transceiver._setNDCTrack(pctrack)
    track.stream.on('data', buf => {
      pctrack.sendMessageBinary(buf)
    })
    if (direction === 'recvonly') {
      transceiver.receiver.track = track
    } else if (direction === 'sendonly') {
      transceiver.sender.track = track
    }
    if (this.#announceNegotiation) {
      this.#announceNegotiation = false
      this.dispatchEvent(new Event('negotiationneeded'))
    }
  }

  addTrack (track, ...streams) {
    for (const stream of streams) stream.addTrack(track)

    const kind = track.kind

    const unused = this.#findUnusedTransceiver(kind)
    if (unused) {
      this.#setUpTrack(unused.media, track, unused, 'sendonly')
      return unused.sender
    } else {
      const transceiver = this.addTransceiver(track, { direction: 'sendonly' })
      return transceiver.sender
    }
  }

  /**
   * @param {MediaStreamTrack | string} trackOrKind
   * @param {RTCRtpTransceiverInit=} opts
   */
  addTransceiver (trackOrKind, { direction = 'inactive', sendEncodings = undefined, streams = undefined } = {}) {
    if (direction === 'sendrecv') throw new TypeError('unsupported')
    const track = trackOrKind instanceof MediaStreamTrack && trackOrKind
    const kind = (track && track.kind) || trackOrKind
    // @ts-ignore
    const ndcMedia = kind === 'video' ? new Video('video', ndcDirectionMap[direction]) : new Audio('audio', ndcDirectionMap[direction])

    const transceiver = new RTCRtpTransceiver({ transceiver: ndcMedia, pc: this })
    this.#transceivers.push(transceiver)
    if (track) {
      this.#setUpTrack(ndcMedia, track, transceiver, direction)
    } else {
      this.#unusedTransceivers.push(transceiver)
    }
    return transceiver
  }

  getReceivers () {
    // receivers are created on ontrack
    return this.#transceivers.map(tr => tr.direction === 'recvonly' && tr.receiver).filter(re => re)
  }

  getSenders () {
    // senders are created on addTrack or addTransceiver
    return this.#transceivers.map(tr => tr.direction === 'sendonly' && tr.sender).filter(se => se)
  }

  getTracks () {
    return [...this.#tracks]
  }

  get maxMessageSize () {
    return this.#peerConnection.maxMessageSize()
  }

  get maxChannels () {
    return this.#peerConnection.maxDataChannelId()
  }

  close () {
    // close all channels before shutting down
    for (const channel of this.#dataChannels) {
      channel.close()
    }
    for (const transceiver of this.#transceivers) {
      transceiver.close()
    }
    for (const track of this.#tracks) {
      track.close()
    }

    this.#peerConnection.close()
  }

  createAnswer () {
    return this.#localAnswer
  }

  #handleDataChannel (channel, opts) {
    const dataChannel = new RTCDataChannel(channel, opts, this)

    // ensure we can close all channels when shutting down
    this.#dataChannels.add(dataChannel)
    dataChannel.addEventListener('close', () => {
      this.#dataChannels.delete(dataChannel)
    })

    return dataChannel
  }

  createDataChannel (label, opts = {}) {
    if (opts.ordered === false) opts.unordered = true
    const channel = this.#peerConnection.createDataChannel('' + label, opts)
    const dataChannel = this.#handleDataChannel(channel, opts)

    if (this.#announceNegotiation == null) {
      this.#announceNegotiation = false
      this.dispatchEvent(new Event('negotiationneeded'))
    }

    return dataChannel
  }

  createOffer () {
    return this.#localOffer
  }

  getConfiguration () {
    return this.#config
  }

  getSelectedCandidatePair () {
    return this.#peerConnection.getSelectedCandidatePair()
  }

  // @ts-expect-error dont support callback based stats
  getStats () {
    const report = new Map()
    const cp = this.getSelectedCandidatePair()
    const bytesSent = this.#peerConnection.bytesSent()
    const bytesReceived = this.#peerConnection.bytesReceived()
    const rtt = this.#peerConnection.rtt()

    const localIdRs = getRandomString(8)
    const localId = 'RTCIceCandidate_' + localIdRs
    report.set(localId, {
      id: localId,
      type: 'local-candidate',
      timestamp: Date.now(),
      candidateType: cp?.local.type,
      ip: cp?.local.address,
      port: cp?.local.port
    })

    const remoteIdRs = getRandomString(8)
    const remoteId = 'RTCIceCandidate_' + remoteIdRs
    report.set(remoteId, {
      id: remoteId,
      type: 'remote-candidate',
      timestamp: Date.now(),
      candidateType: cp?.remote.type,
      ip: cp?.remote.address,
      port: cp?.remote.port
    })

    const candidateId = 'RTCIceCandidatePair_' + localIdRs + '_' + remoteIdRs
    report.set(candidateId, {
      id: candidateId,
      type: 'candidate-pair',
      timestamp: Date.now(),
      localCandidateId: localId,
      remoteCandidateId: remoteId,
      state: 'succeeded',
      nominated: true,
      writable: true,
      bytesSent,
      bytesReceived,
      totalRoundTripTime: rtt,
      currentRoundTripTime: rtt
    })

    const transportId = 'RTCTransport_0_1'
    report.set(transportId, {
      id: transportId,
      timestamp: Date.now(),
      type: 'transport',
      bytesSent,
      bytesReceived,
      dtlsState: 'connected',
      selectedCandidatePairId: candidateId,
      selectedCandidatePairChanges: 1
    })

    const dataChannels = [...this.#dataChannels]

    report.set('P', {
      id: 'P',
      timestamp: Date.now(),
      type: 'peer-connection',
      // TODO: this isn't accurate as it shows currently open/closed channels, not the history count
      dataChannelsClosed: dataChannels.filter(channel => channel.readyState === 'open').length,
      dataChannelsOpened: dataChannels.filter(channel => channel.readyState !== 'open').length
    })

    return Promise.resolve(report)
  }

  getTransceivers () {
    return this.#transceivers
  }

  removeTrack () {
    console.warn('track detatching not supported')
  }

  restartIce () {
    throw new DOMException('Not implemented')
  }

  setConfiguration (config) {
    // TODO: this doesn't actually update the configuration :/
    // most of these are unused x)
    config ??= {}
    if (config.bundlePolicy === undefined) config.bundlePolicy = 'balanced'
    // @ts-ignore
    config.encodedInsertableStreams ??= false
    config.iceCandidatePoolSize ??= 0
    config.iceServers ??= []
    for (let { urls } of config.iceServers) {
      if (!Array.isArray(urls)) urls = [urls]
      for (const url of urls) {
        try {
          // eslint-disable-next-line no-new
          new URL(url)
        } catch (error) {
          throw new DOMException(`Failed to execute 'setConfiguration' on 'RTCPeerConnection': '${url}' is not a valid URL.`, 'SyntaxError')
        }
      }
    }
    config.iceTransportPolicy ??= 'all'
    // @ts-ignore
    config.rtcAudioJitterBufferFastAccelerate ??= false
    // @ts-ignore
    config.rtcAudioJitterBufferMaxPackets ??= 200
    // @ts-ignore
    config.rtcAudioJitterBufferMinDelayMs ??= 0
    config.rtcpMuxPolicy ??= 'require'

    if (config.iceCandidatePoolSize < 0 || config.iceCandidatePoolSize > 255) throw new TypeError("Failed to execute 'setConfiguration' on 'RTCPeerConnection': Failed to read the 'iceCandidatePoolSize' property from 'RTCConfiguration': Value is outside the 'octet' value range.")
    if (config.bundlePolicy !== 'balanced' && config.bundlePolicy !== 'max-compat' && config.bundlePolicy !== 'max-bundle') throw new TypeError("Failed to execute 'setConfiguration' on 'RTCPeerConnection': Failed to read the 'bundlePolicy' property from 'RTCConfiguration': The provided value '" + config.bundlePolicy + "' is not a valid enum value of type RTCBundlePolicy.")
    if (this.#config) {
      if (config.bundlePolicy !== this.#config.bundlePolicy) {
        throw new DOMException("Failed to execute 'setConfiguration' on 'RTCPeerConnection': Attempted to modify the PeerConnection's configuration in an unsupported way.", 'InvalidModificationError')
      }
    }

    this.#config = config
  }

  async setLocalDescription (description) {
    if (description == null || description.type == null) {
      return this.#peerConnection.setLocalDescription()
    }
    // TODO: error and state checking

    if (description.type !== 'offer') {
      // any other type causes libdatachannel to throw
      return this.#peerConnection.setLocalDescription()
    }
    this.#peerConnection.setLocalDescription(description.type)
  }

  async setRemoteDescription (description) {
    if (description.sdp == null) {
      throw new DOMException('Remote SDP must be set')
    }
    // TODO: error and state checking

    this.#peerConnection.setRemoteDescription(description.sdp, description.type)
  }
}

function createDeferredPromise () {
  let resolve, reject
  /** @type {any} */
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  promise.resolve = resolve
  promise.reject = reject
  return promise
}

function getRandomString (length = 0) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
}
