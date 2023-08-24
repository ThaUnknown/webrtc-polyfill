import { JSDOM } from 'jsdom'
import WebRTC from '../index.js'

const WPT_SERVER_URL = 'http://web-platform.test:8000'
const WPT_TEST_PATH_LIST = ['/webrtc/RTCPeerConnection-addIceCandidate.html', '/webrtc/RTCDataChannel-send.html']

// call runTest for each test path
for (const testPath of WPT_TEST_PATH_LIST) {
  console.log('Running test:', testPath)

  const { window } = await JSDOM.fromURL(WPT_SERVER_URL + testPath, {
    runScripts: 'dangerously', resources: 'usable'
  })

  Object.assign(window, WebRTC)

  const result = await new Promise(resolve => {
    const returnObject = []
    window.addEventListener('load', () => {
      window.add_result_callback(test => {
        // Meaning of status
        // 0: PASS (test passed)
        // 1: FAIL (test failed)
        // 2: TIMEOUT (test timed out)
        // 3: PRECONDITION_FAILED (test skipped)
        returnObject.push(test)
      })

      window.add_completion_callback(() => {
        window.close()
        resolve(returnObject)
      })
    })
  })

  console.log('Results:', result)
}
