import EventEmitter from 'events'

import {
  ACK,
  CONTROL_MESSAGE,
  NACK,
  NOTIFICATION,
  PONG,
  RESULT,
  statuses,
} from './message-types'
import { RemoteError } from './remote-error'
import { RemoteObject } from './remote-object'
// TODO(mc, 2017-08-29): Disable winston and uuid because of worker-loader bug
// preventing webpackification of built-in node modules (os and crypto)
// import log from 'winston'
// import uuid from 'uuid/v4'
import { WebSocketClient } from './websocket-client'

// TODO(mc, 2017-08-29): see note about uuid above
let _uniqueId = 0
const uuid = () => `id-${_uniqueId++}`

// timeouts
const HANDSHAKE_TIMEOUT = 10000
const RECEIVE_CONTROL_TIMEOUT = 10000
const CALL_ACK_TIMEOUT = 10000
// const CALL_RESULT_TIMEOUT = 240000

// ping pong
const PING_INTERVAL_MS = 3000
const MISSED_PING_THRESHOLD = 10

// metadata constants
const REMOTE_TARGET_OBJECT = 0
const REMOTE_TYPE_OBJECT = 1

// event name utilities
const makeAckEventName = token => `ack:${token}`
const makeNackEventName = token => `nack:${token}`
const makeSuccessEventName = token => `success:${token}`
const makeFailureEventName = token => `failure:${token}`

// internal RPC over websocket client
// handles the socket itself and object context
class RpcContext extends EventEmitter {
  constructor(ws) {
    super()
    this._ws = ws
    this._resultTypes = new Map()
    this._typeObjectCache = new Map()
    this._pingInterval = null
    this._missedPings = 0

    this.monitoring = false
    this.remote = null
    // default max listeners is 10, we need more than that
    // keeping this at a finite number just in case we get a leak later
    this.setMaxListeners(100)

    ws.on('error', this._handleError.bind(this))
    ws.on('message', this._handleMessage.bind(this))
    ws.once('close', this.close.bind(this))
  }

  callRemote(id, name, args = []) {
    const self = this
    const token = uuid()
    const ackEvent = makeAckEventName(token)
    const nackEvent = makeNackEventName(token)
    const resultEvent = makeSuccessEventName(token)
    const failureEvent = makeFailureEventName(token)

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => handleError('ACK timeout'),
        CALL_ACK_TIMEOUT
      )

      const handleError = (reason, traceback) => {
        cleanup()
        reject(new RemoteError(reason, name, args, traceback))
      }

      const handleFailure = res => {
        if (typeof res === 'string') return handleError(res)
        handleError(res.message, res.traceback)
      }

      const handleNack = reason => handleError(`Received NACK with ${reason}`)

      const handleAck = () => {
        clearTimeout(timeout)
        // TODO(mc, 2017-12-15): result timeouts have been causing too many
        // many problems, so we've disabled them. Figure out a better system
        // because lockups could still be a thing
        // timeout = setTimeout(
        //   () => handleError('Result timeout'),
        //   CALL_RESULT_TIMEOUT
        // )

        this.once(resultEvent, handleSuccess)
        this.once(failureEvent, handleFailure)
      }

      const handleSuccess = result => {
        cleanup()

        RemoteObject(this, result)
          .then(resolve)
          .catch(reject)
      }

      function cleanup() {
        clearTimeout(timeout)
        self.removeAllListeners(ackEvent)
        self.removeAllListeners(nackEvent)
        self.removeAllListeners(resultEvent)
        self.removeAllListeners(failureEvent)
        self.removeListener('error', handleError)
      }

      this.once('error', handleError)
      this.once(ackEvent, handleAck)
      this.once(nackEvent, handleNack)
      this._send({ $: { token }, id, name, args })
    })
  }

  resolveTypeValues(source) {
    const typeId = source.t

    if (!this._resultTypes.has(typeId)) {
      this._resultTypes.set(typeId, REMOTE_TYPE_OBJECT)
    }

    if (this._resultTypes.get(source.i) === REMOTE_TYPE_OBJECT) {
      return Promise.resolve({})
    }

    if (this._typeObjectCache.has(typeId)) {
      return Promise.resolve(this._typeObjectCache.get(typeId).v)
    }

    return this.callRemote(null, 'get_object_by_id', [typeId])
  }

  // close the websocket and cleanup self
  close() {
    clearInterval(this._pingInterval)
    this._ws.removeAllListeners()
    this._ws.close()
    this.eventNames()
      .filter(n => n !== 'close')
      .forEach(n => this.removeAllListeners(n))

    this.emit('close')
  }

  // cache required metadata from call results
  // filter type field from type object to avoid getting unnecessary types
  _cacheCallResultMetadata(resultData) {
    if (!resultData || !resultData.i) {
      return
    }

    const id = resultData.i
    const typeId = resultData.t
    const value = resultData.v || {}

    // grab any type ids (including children) and set the flags
    this._resultTypes.set(typeId, REMOTE_TYPE_OBJECT)
    Object.keys(value)
      .map(key => value[key])
      .filter(v => v && v.t && v.v)
      .forEach(v => this._cacheCallResultMetadata(v))

    if (!this._resultTypes.has(id)) {
      this._resultTypes.set(id, REMOTE_TARGET_OBJECT)
    } else if (this._resultTypes.get(id) === REMOTE_TYPE_OBJECT) {
      this._typeObjectCache.set(id, resultData)
    }
  }

  _startMonitoring() {
    this.monitoring = true
    this._pingInterval = setInterval(this._ping.bind(this), PING_INTERVAL_MS)
  }

  _ping() {
    if (this._missedPings > MISSED_PING_THRESHOLD) return this.close()

    this._send({ $: { ping: true } })
    this._missedPings = this._missedPings + 1
  }

  _handlePong() {
    this._missedPings = 0
  }

  _send(message) {
    // log.debug('Sending: %j', message)
    this._ws.send(message)
  }

  _handleError(error) {
    this.emit('error', error)
  }

  // TODO(mc): split this method up
  _handleMessage(message) {
    const { $: meta, data } = message
    const type = meta.type

    switch (type) {
      case CONTROL_MESSAGE:
        const root = message.root
        const rootType = message.type
        // cache this instance to mark its type as a type object
        // then cache its type object
        this._cacheCallResultMetadata(root)
        this._cacheCallResultMetadata(rootType)

        if (meta.monitor) this._startMonitoring()

        RemoteObject(this, root).then(remote => {
          this.remote = remote
          this.emit('ready')
        })
        // .catch((e) => log.error('Error creating control remote', e))

        break

      case RESULT:
        if (meta.status === statuses.SUCCESS) {
          this._cacheCallResultMetadata(data)
          this.emit(makeSuccessEventName(meta.token), data)
        } else {
          this.emit(makeFailureEventName(meta.token), data)
        }

        break

      case ACK:
        this.emit(makeAckEventName(meta.token))
        break

      case NACK:
        this.emit(makeNackEventName(meta.token), message.reason)
        break

      case NOTIFICATION:
        this._cacheCallResultMetadata(data)

        RemoteObject(this, data, { methods: false }).then(remote =>
          this.emit('notification', remote)
        )
        // .catch((e) => log.error('Error creating notification remote', e))

        break

      case PONG:
        this._handlePong()
        break

      default:
        break
    }
  }
}

export function Client(url) {
  const ws = new WebSocketClient(url)

  return new Promise((resolve, reject) => {
    let context
    let controlTimeout

    const handleReady = () => {
      cleanup()
      resolve(context)
    }

    const handleError = error => {
      cleanup()
      reject(error)
    }

    const handshakeTimeout = setTimeout(
      () => handleError(new Error('Handshake timeout')),
      HANDSHAKE_TIMEOUT
    )

    const handleOpen = () => {
      clearTimeout(handshakeTimeout)
      ws.removeListener('error', handleError)
      controlTimeout = setTimeout(
        () => handleError(new Error('Timeout getting control message')),
        RECEIVE_CONTROL_TIMEOUT
      )

      context = new RpcContext(ws)
        .once('ready', handleReady)
        .once('error', handleError)
    }

    function cleanup() {
      clearTimeout(handshakeTimeout)
      ws.removeListener('open', handleOpen)
      ws.removeListener('error', handleError)

      if (context) {
        clearTimeout(controlTimeout)
        context.removeListener('ready', handleReady)
        context.removeListener('error', handleError)
      }
    }

    ws.once('open', handleOpen)
    ws.once('error', handleError)
  })
}
