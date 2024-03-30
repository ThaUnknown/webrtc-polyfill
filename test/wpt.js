import test from 'tape'
import { JSDOM, VirtualConsole } from 'jsdom'

import { readdir } from 'node:fs/promises'

import { overwriteGlobals } from './util.js'
import { EXCLUSIONS, WPT_SERVER_URL } from './constants.js'

const files = await readdir('./test/wpt/webrtc')
const pathList = files.filter(f => f.endsWith('.html') && !EXCLUSIONS.includes(f))
// const pathList = ['RTCDataChannel-send.html', 'RTCIceTransport.html']

// wait for WPT to load
await new Promise(resolve => setTimeout(resolve, 8000))

// call runTest for each test path
for (const [i, testPath] of pathList.entries()) {
  const isLast = i === pathList.length - 1
  test(testPath, async t => {
    await new Promise(resolve => setTimeout(resolve, 5000))
    try {
      const virtualConsole = new VirtualConsole()
      virtualConsole.sendTo(console)
      const { window } = await JSDOM.fromURL(WPT_SERVER_URL + '/webrtc/' + testPath, {
        runScripts: 'dangerously',
        resources: 'usable',
        omitJSDOMErrors: true,
        virtualConsole,
        beforeParse: window => {
          // JSDom is a different VM, and WPT does strict checking, so to pass tests these need to be overwritten, this is an awful idea!
          overwriteGlobals(window)
        }
      })

      const e = await new Promise(resolve => {
        const cleanup = e => {
          window.close()
          resolve(e)
          process.off('unhandledRejection', cleanup)
          process.off('uncaughtException', cleanup)
        }
        window.addEventListener('load', () => {
          overwriteGlobals(window)
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
      t.end(e)
    } catch (e) {
      t.end(e)
    }
    if (isLast) process.exit()
  })
}
