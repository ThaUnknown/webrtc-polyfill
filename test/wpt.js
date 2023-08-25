import test from 'tape'
import { JSDOM, VirtualConsole } from 'jsdom'
import DOMException from 'node-domexception'

import { readdir } from 'node:fs/promises'

import WebRTC from '../index.js'

const EXCLUSIONS = [
  // navigator.getUserMedia
  'receiver-track-live.https.html',
  'recvonly-transceiver-can-become-sendrecv.https.html',
  'RollbackEvents.https.html',
  'RTCPeerConnection-add-track-no-deadlock.https.html',
  'RTCIceConnectionState-candidate-pair.https.html',
  'RTCPeerConnection-add-track-no-deadlock.https.html',
  'RTCDTMFSender-ontonechange-long.https.html',
  'RTCPeerConnection-connectionState.https.html',
  // MediaStream
  'RTCPeerConnection-capture-video.https.html',
  'RTCDtlsTransport-state.html',
  // AudioContext
  'RTCDtlsTransport-getRemoteCertificates.html',
  // utility files
  'RTCCertificate-postMessage.html',
  // following require getConfig/setConfig which is not implemented
  'RTCConfiguration-iceServers.html',
  'RTCConfiguration-iceTransportPolicy.html',
  'RTCConfiguration-rtcpMuxPolicy.html',
  // mysterious process exits
  'RTCPeerConnection-addIceCandidate.html'
]

const WPT_SERVER_URL = 'http://web-platform.test:8000'
const WPT_FILES_LIST = await readdir('./test/wpt/webrtc')
const WPT_TEST_PATH_LIST = WPT_FILES_LIST.filter(f => f.endsWith('.html') && !EXCLUSIONS.includes(f))
// const WPT_TEST_PATH_LIST = ['RTCPeerConnection-createDataChannel.html']

// wait for WPT to load
await new Promise(resolve => setTimeout(resolve, 8000))

// call runTest for each test path
for (const testPath of WPT_TEST_PATH_LIST) {
  test(testPath, async t => {
    try {
      const virtualConsole = new VirtualConsole()
      virtualConsole.sendTo(console)
      const { window } = await JSDOM.fromURL(WPT_SERVER_URL + '/webrtc/' + testPath, {
        runScripts: 'dangerously', resources: 'usable', omitJSDOMErrors: true, virtualConsole
      })

      Object.assign(window, WebRTC)
      // JSDOM overwrites these lol
      window.TypeError = TypeError
      window.DOMException = DOMException

      await new Promise(resolve => {
        const cleanup = e => {
          window.close()
          resolve()
          t.end(e)
        }
        window.addEventListener('load', () => {
          window.add_completion_callback((tests, status, records) => {
            for (const { name, status, message, stack } of tests) {
              t.comment(name)
              t.ok(status === 0, (message || name) + (stack || ''))
            }
            cleanup()
          })
          process.once('unhandledRejection', cleanup)
          process.once('uncaughtException', cleanup)
        })
      })
    } catch (e) {
      t.end(e)
    }
  })
}
