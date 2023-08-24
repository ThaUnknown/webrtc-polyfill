import { readdir } from 'node:fs/promises'

import { JSDOM } from 'jsdom'

import WebRTC from '../index.js'

const WPT_SERVER_URL = 'http://web-platform.test:8000'

const WPT_FILES_LIST = await readdir('./test/wpt/webrtc')

const WPT_TEST_PATH_LIST = WPT_FILES_LIST.filter(f => f.endsWith('.html'))

// wait for WPT to load
await new Promise(resolve => setTimeout(resolve, 15000))

// call runTest for each test path
for (const testPath of WPT_TEST_PATH_LIST) {
  console.log('Running test:', testPath)
  const { window } = await JSDOM.fromURL(WPT_SERVER_URL + '/webrtc/' + testPath, {
    runScripts: 'dangerously', resources: 'usable'
  })

  Object.assign(window, WebRTC)

  const result = await new Promise(resolve => {
    const returnObject = []
    window.addEventListener('load', () => {
      window.add_result_callback(test => {
        console.log(test)
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
