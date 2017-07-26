import winston from 'winston'
import uuidV4 from 'uuid/v4'
import WebSocket from 'ws'

const log = winston

const DISPATCHED = 0
const ACKNOWLEDGED = 1
const RETURNED = 2

const CALL_RESULT_MESSAGE = 0
const CALL_ACK_MESSAGE = 1
const NOTIFICATION_MESSAGE = 2
const CONTROL_MESSAGE = 3

const MSEC = 1
const SEC = 1000 * MSEC

const HANDSHAKE_TIMEOUT = 5 * SEC
const CONNECTION_TIMEOUT = 10 * SEC
const CALL_RESULT_TIMEOUT = 10 * SEC
const CALL_ACK_TIMEOUT = 5 * SEC

// winston.level = 'warning'

// To prevent from dispatching these calls to the remote
const SPECIAL_FUNCTION_NAMES =
  new Set([
    'then',
    'inspect',
    'asymmetricMatch',
    'constructor',
    '$$typeof',
    'nodeType',
    '@@__IMMUTABLE_LIST__@@',
    '@@__IMMUTABLE_SET__@@',
    '@@__IMMUTABLE_MAP__@@',
    '@@__IMMUTABLE_STACK__@@',
    'toJSON',
    'valueOf'
  ])

const RemoteObject = (context, obj, isValueNode = false) => {
  // A shorthand to alternate between Reference Node and Value Node
  // in JSON object graph. See below for details
  const nextRemoteObject = (nextObject) =>
    RemoteObject(context, nextObject, !isValueNode)

  // Returns a proxy object that points to the record in the
  // instances map that corresponds to the id of a remote object
  const getProxy = (id, instance) => {
    // If no id, the object is not remote, return it
    if (!id) return instance
    // Store locally only if there is value
    // If there is an id but no value, it's a circular reference
    if (instance) context.put(id, instance)
    return new Proxy({}, // <- object we are proxying
      {
        // Needed for reflection
        getOwnPropertyDescriptor: (target, prop) => {
          const remote = context.get(id)
          return Object.getOwnPropertyDescriptor(remote, prop)
        },
        // Probably too ...
        ownKeys: () => {
          const remote = context.get(id)
          const keys = Object.getOwnPropertyNames(remote)
          return keys
        },
        // Trap attempts to access object's properties
        get: (target, name) => {
          if (SPECIAL_FUNCTION_NAMES.has(name)) return target[name]
          if (typeof name === 'symbol') return target[name]
          const remote = context.get(id)
          if (Object.prototype.hasOwnProperty.call(remote, name)) {
            return remote[name]
          }
          // If there is no value to be found between target and instances map
          // return a promise that will dispatch a remote function call
          return async (...args) => {
            const res = await context.callRemoteMethod(id, name, args)
            if (res.$.status === 'error') throw new Error(res.data)
            return RemoteObject(context, res.data)
          }
        }
      })
  }

  if (isValueNode) {
    if (!obj) return obj

    const res = {}
    // If object iterate through keys / values
    // TODO: explore why Object.entries from ES2017 is not working
    // What's the idiomatic way of mapping through key / values?
    Object.keys(obj)
      .forEach((key) => { res[key] = nextRemoteObject(obj[key]) })

    return res
  }

  if (Array.isArray(obj)) {
    return obj.map(
      item => RemoteObject(context, item, isValueNode))
  }

  // Check if primitive
  if (obj !== Object(obj)) return obj

  return getProxy(obj.i, nextRemoteObject(obj.v))
}

const Context = (connection) => ({
  connection,
  // Remote calls in progress
  pendingCalls: new Map(),
  // Local copies of remote objects
  instances: new Map(),
  put(id, value) {
    if (this.instances.has(id)) log.info(`Updating instance with ${{ id }}`)
    this.instances.set(id, value)
  },
  // TODO: if not found, try to retrieve from remote?
  get(id) {
    if (!this.instances.has(id)) {
      log.info(`Local instance with id=${{ id }} is missing`)
      return undefined
    }
    return this.instances.get(id)
  },

  callRemoteMethod(id, name, args) {
    const token = uuidV4()
    const removePending = v => this.pendingCalls.delete(token) && v
    const promise = new Promise((resolve, reject) => {
      if (typeof name === 'symbol') return resolve(undefined)
      if (SPECIAL_FUNCTION_NAMES.has(name)) {
        log.warn(`Not dispatching ES special function ${name}()`)
        return resolve(undefined)
      }
      this.pendingCalls.set(token, this.Call(id, resolve, reject))
      log.info(`Calling ${name}(${args})`)
      try {
        this.connection.send(JSON.stringify({ $: { token }, name, id, args }))
      } catch (e) {
        return reject(e)
      }
    })
    // Remove call from pending in either case
    return promise.then(removePending, removePending)
  },

  // id : unique id of the call being dispatched
  // resolve/reject : handlers from a Promise generated upstream
  Call: (id, resolve, reject) => ({
    // Valid state sequence:
    // DISPATCHED -> ACKNOWLEDGED -> RETURNED
    state: DISPATCHED,
    // Create ACK timer first
    timer: setTimeout(() => reject('Call ACK timed out'), CALL_ACK_TIMEOUT),
    handle(message) {
      switch (message.$.type) {
        // Server will acknowledge call first
        case CALL_ACK_MESSAGE:
          clearTimeout(this.timer)
          if (this.state !== DISPATCHED) return reject('Received unexpected ACK')
          this.state = ACKNOWLEDGED
          this.timer = setTimeout(
            () => reject('Timed out waiting for result'), CALL_RESULT_TIMEOUT)
          break
        // Then dispatch the result once ready
        case CALL_RESULT_MESSAGE:
          clearTimeout(this.timer)
          if (this.state !== ACKNOWLEDGED) {
            return reject('Received result without call being ACKed first')
          }
          this.state = RETURNED
          resolve(message)
          break
        default:
          return reject(`Unknown message type: ${message.$.type}`)
      }
    }
  }),

  // Dispatch message to one of the Calls pending
  dispatch(message) {
    const token = message.$.token
    const call = this.pendingCalls.get(token)
    if (!call) {
      log.error(`Call with token=${token} was never issued`)
      return
    }
    return call.handle(message)
  },
})

const Connection = (url) => {
  log.debug(`Connecting to ${url}`)

  let register = null
  const socket = new WebSocket(url)
  const promise = new Promise((resolve, reject) => {
    register = () => {
      socket.addEventListener('open', () => resolve(socket))
      socket.addEventListener('error', (error) => reject(error))
    }
    setTimeout(
      () => reject(`Connection timeout: ${url}`),
      CONNECTION_TIMEOUT)
  })
  // Dispatching outside of promise to avoid race condition
  register()
  // In addition to promise, return socket for test purposes
  // TODO: find a way to mock socket that works in async
  return { promise, socket }
}

const Client = (connection, notify) => {
  const context = Context(connection)

  return new Promise((resolve, reject) => {
    setTimeout(
      () => reject('Handshake timeout'),
      HANDSHAKE_TIMEOUT)
    // Run on nextTick to avoid race condition
    process.nextTick(() => connection.addEventListener(
      'message', (event) => {
        try {
          const message = JSON.parse(event.data)
          log.info(`Received message: ${JSON.stringify(message)}`)
          switch (message.$.type) {
            case CONTROL_MESSAGE:
              return resolve(RemoteObject(context, message.data))
            case NOTIFICATION_MESSAGE:
              log.info(`Notification: ${message}`)
              notify(message)
              break
            default:
              context.dispatch(message)
          }
        } catch (e) {
          log.warning(`Websocket loop: ${e}`)
          return reject(e)
        }
      }
    ))
  })
}

export default { Connection, Client, Context, RemoteObject }
