import { equal } from 'uint8-util'
import DOMException from 'node-domexception'

import { Blob } from 'node:buffer'

import WebRTC from '../index.js'
import { MediaStream, MediaStreamTrack } from '../lib/MediaStream.js'

function blobToArrayBuffer (blob) {
  return blob.arrayBuffer()
}

function assertEqualsTypedArray (a, b) {
  return equal(new Uint8Array(a), new Uint8Array(b))
}

const mediaDevices = {
  async getUserMedia (opts = {}) {
    const tracks = []
    if (opts.video) tracks.push(video())
    if (opts.audio) tracks.push(audio())
    return new MediaStream(tracks)
  }
}

function audio () {
  return new MediaStreamTrack({ kind: 'audio' })
}

function video () {
  return new MediaStreamTrack({ kind: 'video' })
}

function canCreate () {
  return true
}

export function overwriteGlobals (window) {
  Object.assign(window, WebRTC)
  if (window.trackFactories) {
    window.trackFactories.audio = audio
    window.trackFactories.video = video
    window.trackFactories.canCreate = canCreate
  }
  window.navigator.mediaDevices = mediaDevices
  window.TypeError = TypeError
  window.DOMException = DOMException
  window.Blob = Blob
  window.ArrayBuffer = ArrayBuffer
  window.assert_equals_typed_array = assertEqualsTypedArray
  window.blobToArrayBuffer = blobToArrayBuffer
}
