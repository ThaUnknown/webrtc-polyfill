import runner from 'wpt-runner'
import WebRTC from '../index.js'

try {
  const res = await runner('./test/wpt', {
    setup: window => {
      for (const [key, value] of Object.entries(WebRTC)) {
        if (key !== 'default') {
          window[key] ??= value
        }
      }
    },
    filter: testPath => {
      return testPath.startsWith('webrtc/')
    }
  })
  console.log(res)
} catch (e) {
  console.log(e)
}

process.on('unhandledRejection', console.log)

process.on('rejectionHandled', console.log)
