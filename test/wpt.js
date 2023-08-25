import test from 'tape'
import { JSDOM, VirtualConsole } from 'jsdom'

import { readdir } from 'node:fs/promises'

import WebRTC from '../index.js'

const EXCLUSIONS = [
  'receiver-track-live.https.html', // navigator.getUserMedia
  'recvonly-transceiver-can-become-sendrecv.https.html', // navigator.getUserMedia
  'RollbackEvents.https.html', // navigator.getUserMedia
  'RTCCertificate-postMessage.html', // utility file
  // following require getConfig/setConfig which is not implemented
  'RTCConfiguration-iceServers.html',
  'RTCConfiguration-iceTransportPolicy.html',
  'RTCConfiguration-rtcpMuxPolicy.html'
]

const WPT_SERVER_URL = 'http://web-platform.test:8000'
const WPT_FILES_LIST = await readdir('./test/wpt/webrtc')
const WPT_TEST_PATH_LIST = WPT_FILES_LIST.filter(f => f.endsWith('.html') && !EXCLUSIONS.includes(f))

// wait for WPT to load
await new Promise(resolve => setTimeout(resolve, 8000))

test('WebRTC Web Platform Tests', async t => {
  // call runTest for each test path
  for (const testPath of WPT_TEST_PATH_LIST) {
    try {
      const virtualConsole = new VirtualConsole()
      virtualConsole.sendTo(console)
      const { window } = await JSDOM.fromURL(WPT_SERVER_URL + '/webrtc/' + testPath, {
        runScripts: 'dangerously', resources: 'usable', omitJSDOMErrors: true, virtualConsole
      })

      Object.assign(window, WebRTC)

      t.comment(testPath)

      await new Promise(resolve => {
        window.addEventListener('load', () => {
          window.add_completion_callback((tests, status, records) => {
            for (const { name, status, message, stack } of tests) {
              t.comment(name)
              t.ok(status === 0, (message || name) + (stack || ''))
            }
            window.close()
            resolve()
          })
        })
      })
    } catch (e) {
      t.error(e)
    }
  }
  t.end()
})
