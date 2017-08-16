import EventEmitter from 'events'
import log from 'winston'
import uuid from 'uuid/v4'

import WebSocketClient from './websocket-client'
import RemoteObject from './remote-object'
import {statuses, RESULT, ACK, NOTIFICATION, CONTROL_MESSAGE} from './message-types'

// timeouts
const HANDSHAKE_TIMEOUT = 5000
const RECEIVE_CONTROL_TIMEOUT = 500
const CALL_ACK_TIMEOUT = 5000
const CALL_RESULT_TIMEOUT = 60000

// metadata constants
const REMOTE_TARGET_OBJECT = 0
const REMOTE_TYPE_OBJECT = 1

// event name utilities
const makeAckEventName = (token) => `ack:${token}`
const makeSuccessEventName = (token) => `success:${token}`
const makeFailureEventName = (token) => `failure:${token}`

// internal RPC over websocket client
// handles the socket itself and object context
class RpcContext extends EventEmitter {
  constructor (ws) {
    super()
    this._ws = ws
    this._resultTypes = new Map()
    this._typeObjectCache = new Map()
    this.control = null
    // default max listeners is 10, we need more than that
    // keeping this at a finite number just in case we get a leak later
    this.setMaxListeners(100)

    ws.on('error', this._handleError.bind(this))
    ws.on('message', this._handleMessage.bind(this))
  }

  call (id, name, args) {
    const self = this
    const token = uuid()
    const ackEvent = makeAckEventName(token)
    const resultEvent = makeSuccessEventName(token)
    const failureEvent = makeFailureEventName(token)

    this._send({$: {token}, id, name, args})

    return new Promise((resolve, reject) => {
      let timeout

      const handleError = (error) => {
        cleanup()
        reject(error)
      }

      const handleFailure = (result) => {
        handleError(new Error(result))
      }

      const handleSuccess = (result) => {
        cleanup()

        RemoteObject(this, result)
          .then(resolve)
          .catch(reject)
      }

      const handleAck = () => {
        clearTimeout(timeout)
        timeout = setTimeout(
          () => handleError(new Error(`Result timeout for call ${token}`)),
          CALL_RESULT_TIMEOUT
        )

        this.once(resultEvent, handleSuccess)
        this.once(failureEvent, handleFailure)
      }

      function cleanup () {
        clearTimeout(timeout)
        self.removeAllListeners(ackEvent)
        self.removeAllListeners(resultEvent)
        self.removeAllListeners(failureEvent)
        self.removeListener('error', handleError)
      }

      this.once('error', handleError)
      this.once(ackEvent, handleAck)
      timeout = setTimeout(
        () => handleError(new Error(`Ack timeout for call ${token}`)),
        CALL_ACK_TIMEOUT
      )
    })
  }

  resolveTypeValues (source) {
    const typeId = source.t

    if (this._resultTypes.get(source.i) === REMOTE_TYPE_OBJECT) {
      return Promise.resolve({})
    }

    if (this._typeObjectCache.has(typeId)) {
      return Promise.resolve(this._typeObjectCache.get(typeId).v)
    }

    return this.control.get_object_by_id(typeId)
  }

  // close the websocket
  close () {
    this._ws.close()
  }

  // cache required metadata from call results
  // filter type field from type object to avoid getting unecessary types
  _cacheCallResultMetadata (resultData) {
    if (!resultData || !resultData.i) {
      return
    }

    const id = resultData.i
    const typeId = resultData.t
    const value = resultData.v || {}

    // grab any type ids (including children) and set the flags
    this._resultTypes.set(typeId, REMOTE_TYPE_OBJECT)
    Object.keys(value)
      .map((key) => value[key])
      .filter((v) => v && v.t && v.v)
      .forEach((v) => this._cacheCallResultMetadata(v))

    if (!this._resultTypes.has(id)) {
      this._resultTypes.set(id, REMOTE_TARGET_OBJECT)
    } else if (this._resultTypes.get(id) === REMOTE_TYPE_OBJECT) {
      this._typeObjectCache.set(id, resultData)
    }
  }

  _send (message) {
    log.debug('Sending: %j', message)
    this._ws.send(message)
  }

  _handleError (error) {
    this.emit('error', error)
  }

  // TODO(mc): split this method up
  _handleMessage (message) {
    log.debug('Received message %j', message)

    const meta = message.$
    const data = message.data
    const type = meta.type
    let control

    switch (type) {
      case CONTROL_MESSAGE:
        control = message.control
        // cache this instance to mark its type as a type object
        // then cache its type object
        this._cacheCallResultMetadata(control.instance)
        this._cacheCallResultMetadata(control.type)

        RemoteObject(this, control.instance)
          .then((controlRemote) => {
            this.control = controlRemote
            this.emit('ready')
          })
          .catch((e) => log.error('Error creating control remote', e))

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

      case NOTIFICATION:
        this._cacheCallResultMetadata(data)

        RemoteObject(this, data)
          .then((remote) => this.emit('notification', remote))
          .catch((e) => log.error('Error creating notification remote', e))

        break

      default:
        break
    }
  }
}

export default function Client (url) {
  const ws = new WebSocketClient(url)

  return new Promise((resolve, reject) => {
    let context
    let controlTimeout

    const handleReady = () => {
      cleanup()
      resolve(context)
    }

    const handleError = (error) => {
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

    function cleanup () {
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
