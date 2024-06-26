const componentMap = {
  1: 'rtp',
  2: 'rtcp'
}

/**
 * @class
 * @implements {globalThis.RTCIceCandidate}
 */
export default class RTCIceCandidate {
  #address
  #candidate
  #component
  #foundation
  #port
  #priority
  #protocol
  #relatedAddress
  #relatedPort
  #sdpMLineIndex
  #sdpMid
  #tcpType
  #type
  #usernameFragment

  /**
     * @param  {RTCIceCandidateInit} init={}
     */
  constructor ({ candidate, sdpMLineIndex, sdpMid, usernameFragment } = {}) {
    if (sdpMLineIndex == null && sdpMid == null) {
      throw new TypeError("Failed to construct 'RTCIceCandidate': sdpMid and sdpMLineIndex are both null.")
    }
    this.#candidate = candidate
    this.#sdpMLineIndex = sdpMLineIndex ?? null
    this.#sdpMid = sdpMid ?? null
    this.#usernameFragment = usernameFragment ?? null

    if (candidate && candidate.indexOf('candidate:') !== -1) {
      const interest = candidate.slice(candidate.indexOf('candidate:') + 10)

      // TODO: can this extract usernameFragment? *pc->localDescription()->iceUfrag()
      /** @type {any[]} split */
      // eslint-disable-next-line no-unused-vars
      const [foundation, componentID, protocol, priority, ip, port, _typ, type, ...rest] = interest.split(' ')

      this.#foundation = foundation
      this.#component = componentMap[componentID]

      this.#protocol = protocol
      this.#priority = Number(priority)
      this.#address = ip
      this.#port = Number(port)
      this.#type = type

      if (protocol === 'tcp') {
        const tcptypeIndex = rest.indexOf('tcptype')
        if (tcptypeIndex !== -1) this.#tcpType = rest[tcptypeIndex + 1]
      }

      if (type !== 'host') {
        const raddrIndex = rest.indexOf('raddr')
        if (raddrIndex !== -1) this.#relatedAddress = rest[raddrIndex + 1]

        const rportIndex = rest.indexOf('rport')
        if (rportIndex !== -1) this.#relatedPort = Number(rest[rportIndex + 1])
      }
    }
  }

  get address () {
    return this.#address ?? null
  }

  get candidate () {
    return this.#candidate ?? ''
  }

  get component () {
    return this.#component
  }

  get foundation () {
    return this.#foundation ?? null
  }

  get port () {
    return this.#port ?? null
  }

  get priority () {
    return this.#priority ?? null
  }

  get protocol () {
    return this.#protocol ?? null
  }

  get relatedAddress () {
    return this.#relatedAddress ?? null
  }

  get relatedPort () {
    return this.#relatedPort ?? null
  }

  get sdpMLineIndex () {
    return this.#sdpMLineIndex
  }

  get sdpMid () {
    return this.#sdpMid
  }

  get tcpType () {
    return this.#tcpType ?? null
  }

  get type () {
    return this.#type ?? null
  }

  get usernameFragment () {
    return this.#usernameFragment
  }

  toJSON () {
    return {
      candidate: this.#candidate,
      sdpMLineIndex: this.#sdpMLineIndex,
      sdpMid: this.#sdpMid,
      usernameFragment: this.#usernameFragment
    }
  }
}
