// @ts-check
import { Readable } from 'node:stream'

/**
 * @class
 * @implements {globalThis.MediaStreamTrack}
 */
export default class MediaStreamTrack extends EventTarget {
  media
  track
  stream = new Readable()
  #kind
  #label
  #id = crypto.randomUUID()
  contentHint = ''

  onmute
  onunmute
  onended

  constructor ({ kind, label }) {
    super()
    if (!kind) throw new TypeError("Failed to construct 'MediaStreamTrack': Failed to read the 'kind' property from 'MediaStreamTrackInit': Required member is undefined.")
    this.#kind = kind
    this.#label = label

    this.addEventListener('ended', e => {
      this.onended?.(e)
      this.track?.close()
      this.stream.destroy()
    })
    this.stream.on('close', () => {
      this.stop()
    })
  }

  async applyConstraints () {
    console.warn('Constraints unsupported, ignored')
  }

  stop () {
    this.track?.close()
    this.stream.destroy()
    this.dispatchEvent(new Event('ended'))
  }

  getSettings () {
    console.warn('Settings upsupported, ignored')
    return {}
  }

  getConstraints () {
    console.warn('Constraints unsupported, ignored')
    return {}
  }

  getCapabilities () {
    console.warn('Capabilities unsupported, ignored')
    return {}
  }

  clone () {
    console.warn('Track clonning is unsupported, returned this instance')
    return this
  }

  get kind () {
    return this.#kind
  }

  get enabled () {
    return this.track?.isOpen()
  }

  set enabled (_) {
    console.warn('Track enabling and disabling is unsupported, ignored')
  }

  get muted () {
    return false
  }

  get id () {
    return this.#id
  }

  get label () {
    return this.#label
  }

  get readyState () {
    return this.track?.isClosed() ? 'ended' : 'live'
  }
}
