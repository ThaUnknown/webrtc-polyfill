// @ts-check
import NodeDataChannel from 'node-datachannel'
import DOMException from 'node-domexception'
import RTCSessionDescription from './RTCSessionDescription.js'
import RTCDataChannel from './RTCDataChannel.js'
import RTCIceCandidate from './RTCIceCandidate.js'
import { RTCDataChannelEvent, RTCPeerConnectionIceEvent, RTCTrackEvent } from './Events.js'
import { RTCRtpTransceiver } from './RTCRtp.js'
import MediaStreamTrack from './MediaStreamTrack.js'

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
  #dataChannels
  #config
  #canTrickleIceCandidates
  #sctp
  #localCandidates = []
  #remoteCandidates = []

  onconnectionstatechange
  ondatachannel
  onicecandidate
  // TODO: not implemented
  onicecandidateerror
  oniceconnectionstatechange
  onicegatheringstatechange
  // TODO: not implemented
  onnegotiationneeded
  onsignalingstatechange
  ontrack

  constructor (init = {}) {
    super()

    this.#config = init
    this.#localOffer = createDeferredPromise()
    this.#localAnswer = createDeferredPromise()
    this.#dataChannels = new Set()
    this.#canTrickleIceCandidates = null
    this.#sctp = null

    const iceServers = init?.iceServers ?? []

    this.#peerConnection = new NodeDataChannel.PeerConnection(init?.peerIdentity || `peer-${getRandomString(7)}`, {
      iceServers: iceServers
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
      iceTransportPolicy: init?.iceTransportPolicy
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

    this.#peerConnection.onDataChannel(channel => {
      const dataChannel = new RTCDataChannel(channel)
      this.#dataChannels.add(dataChannel)
      this.dispatchEvent(new RTCDataChannelEvent(dataChannel))
    })

    this.#peerConnection.onLocalDescription((sdp, type) => {
      if (type === 'offer') {
        this.#localOffer.resolve({ sdp, type })
      }

      if (type === 'answer') {
        this.#localAnswer.resolve({ sdp, type })
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
      const transceiver = new RTCRtpTransceiver({ media: track })
      transceiver._setNDCTrack(track)
      this.#transceivers.push(transceiver)
      const mediastream = new MediaStreamTrack()
      mediastream.track = track
      track.onMessage(buf => mediastream.stream.push(buf))
      transceiver.receiver.track = mediastream
      this.dispatchEvent(new RTCTrackEvent({ track: mediastream, receiver: transceiver.receiver, transceiver }))
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
    return this.#peerConnection.iceState()
  }

  get iceGatheringState () {
    return this.#peerConnection.gatheringState()
  }

  get currentLocalDescription () {
    return new RTCSessionDescription(this.#peerConnection.localDescription())
  }

  get currentRemoteDescription () {
    return new RTCSessionDescription(this.#peerConnection.remoteDescription())
  }

  get localDescription () {
    return new RTCSessionDescription(this.#peerConnection.localDescription())
  }

  get pendingLocalDescription () {
    return new RTCSessionDescription(this.#peerConnection.localDescription())
  }

  get pendingRemoteDescription () {
    return new RTCSessionDescription(this.#peerConnection.remoteDescription())
  }

  get remoteDescription () {
    return new RTCSessionDescription(this.#peerConnection.remoteDescription())
  }

  get sctp () {
    return this.#sctp
  }

  get signalingState () {
    return this.#peerConnection.signalingState()
  }

  static generateCertificate (keygenAlgorithm) {
    throw new DOMException('Not implemented')
  }

  async addIceCandidate (candidate) {
    if (candidate == null || candidate.candidate == null) {
      throw new DOMException('Candidate invalid')
    }
    this.#remoteCandidates.push(candidate)
    this.#peerConnection.addRemoteCandidate(candidate.candidate, candidate.sdpMid ?? '0')
  }

  #findUnusedTransceiver (kind) {
    const unused = this.#unusedTransceivers.find(tr => tr.track.kind === kind && tr.direction === 'sendonly')
    if (!unused) return
    this.#unusedTransceivers.splice(this.#unusedTransceivers.indexOf(unused), 1)
    return unused
  }

  #setUpTrack (media, track, transceiver, direction) {
    const session = new NodeDataChannel.RtcpReceivingSession()
    const pctrack = this.#peerConnection.addTrack(media)
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

  #transceivers = []
  #unusedTransceivers = []
  /**
   * @param {MediaStreamTrack | string} trackOrKind
   * @param {RTCRtpTransceiverInit=} opts
   */
  addTransceiver (trackOrKind, { direction = 'inactive', sendEncodings = undefined, streams = undefined } = {}) {
    if (direction === 'sendrecv') throw new TypeError('unsupported')
    const track = trackOrKind instanceof MediaStreamTrack && trackOrKind
    const kind = (track && track.kind) || trackOrKind
    // @ts-ignore
    const ndcMedia = kind === 'video' ? new NodeDataChannel.Video('video', ndcDirectionMap[direction]) : new NodeDataChannel.Audio('audio', ndcDirectionMap[direction])

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

  close () {
    // close all channels before shutting down
    this.#dataChannels.forEach(channel => {
      channel.close()
    })

    this.#peerConnection.close()
  }

  createAnswer () {
    return this.#localAnswer
  }

  createDataChannel (label, opts = {}) {
    const channel = this.#peerConnection.createDataChannel(label, opts)
    const dataChannel = new RTCDataChannel(channel, opts)

    // ensure we can close all channels when shutting down
    this.#dataChannels.add(dataChannel)
    dataChannel.addEventListener('close', () => {
      this.#dataChannels.delete(dataChannel)
    })

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

  getStats () {
    return new Promise((resolve) => {
      const report = new Map()
      const cp = this.getSelectedCandidatePair()
      const bytesSent = this.#peerConnection.bytesSent()
      const bytesReceived = this.#peerConnection.bytesReceived()
      const rtt = this.#peerConnection.rtt()

      const localIdRs = getRandomString(8)
      const localId = 'RTCIceCandidate_' + localIdRs
      report.set(localId, {
        id: localId,
        type: 'localcandidate',
        timestamp: Date.now(),
        candidateType: cp?.local.type,
        ip: cp?.local.address,
        port: cp?.local.port
      })

      const remoteIdRs = getRandomString(8)
      const remoteId = 'RTCIceCandidate_' + remoteIdRs
      report.set(remoteId, {
        id: remoteId,
        type: 'remotecandidate',
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

      return resolve(report)
    })
  }

  getTransceivers () {
    return [] // throw new DOMException('Not implemented');
  }

  removeTrack () {
    throw new DOMException('Not implemented')
  }

  restartIce () {
    throw new DOMException('Not implemented')
  }

  setConfiguration (config) {
    this.#config = config
  }

  async setLocalDescription (description) {
    if (description == null || description.type == null) {
      throw new DOMException('Local description type must be set')
    }

    if (description.type !== 'offer') {
      // any other type causes libdatachannel to throw
      return
    }
    this.#peerConnection.setLocalDescription(description.type)
  }

  async setRemoteDescription (description) {
    if (description.sdp == null) {
      throw new DOMException('Remote SDP must be set')
    }

    this.#peerConnection.setRemoteDescription(description.sdp, description.type)
  }
}

function createDeferredPromise () {
  let resolve, reject
  /** @type {any} */
  const promise = new Promise(function (_resolve, _reject) {
    resolve = _resolve
    reject = _reject
  })

  promise.resolve = resolve
  promise.reject = reject
  return promise
}

function getRandomString (length) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
}
