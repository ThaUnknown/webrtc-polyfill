export const EXCLUSIONS = [
  // navigator.getUserMedia
  // 'receiver-track-live.https.html',
  // 'recvonly-transceiver-can-become-sendrecv.https.html',
  // 'RollbackEvents.https.html',
  // 'RTCPeerConnection-add-track-no-deadlock.https.html',
  // 'RTCIceConnectionState-candidate-pair.https.html',
  // 'RTCDTMFSender-ontonechange-long.https.html',
  // 'RTCPeerConnection-connectionState.https.html',
  // MediaStream
  // 'RTCPeerConnection-capture-video.https.html',
  // 'RTCDtlsTransport-state.html',
  // AudioContext
  // 'RTCDtlsTransport-getRemoteCertificates.html',
  // utility files
  'RTCCertificate-postMessage.html',
  // getConfig/setConfig which is not implemented
  'RTCConfiguration-iceServers.html',
  'RTCConfiguration-iceTransportPolicy.html',
  'RTCConfiguration-rtcpMuxPolicy.html',
  // generateCerficicate which is not implemented
  'RTCPeerConnection-generateCertificate.html',
  // RTCCertificate which is not implemented
  'RTCCertificate.html',
  // mysterious process exits
  'RTCPeerConnection-addIceCandidate.html',
  'RTCPeerConnection-canTrickleIceCandidates.html',
  'RTCPeerConnection-createDataChannel.html',
  'RTCPeerConnection-getStats.https.html'
]

export const WPT_SERVER_URL = 'http://web-platform.test:8000'
