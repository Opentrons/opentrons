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
    'toJSON'
  ])

const ES_BUILTIN_TYPES = new Set(['string', 'number', 'boolean', 'undefined'])

const RemoteObject = (context, obj, isValueNode = true) => {
  const nextRemoteObject = (...args) =>
    RemoteObject(...args, !isValueNode)

  const getProxy = (that) =>
    new Proxy({}, // <- object we are proxying
      {
        getOwnPropertyDescriptor: (target, prop) => {
          const remote = context.get(that)
          return Object.getOwnPropertyDescriptor(remote, prop)
        },
        ownKeys: () => {
          const remote = context.get(that)
          const keys = Object.getOwnPropertyNames(remote)
          return keys
        },
        // Trap attempts to access object's properties
        get: (target, name) => {
          if (SPECIAL_FUNCTION_NAMES.has(name)) return target[name]
          if (typeof name === 'symbol') return target[name]
          const remote = context.get(that)
          if (!remote) return remote
          if (Object.prototype.hasOwnProperty.call(remote, name)) {
            return remote[name]
          }

          return async (...args) => {
            const res = await context.callRemoteMethod(that, name, args)
            if (res.$meta.status === 'error') throw new Error(res.str)
            // If no remote object returned, delete meta altogether
            if (!(res.$meta.that)) delete res.$meta
            return RemoteObject(context, res)
          }
        }
      })

  const { $meta, ...values } = obj

  if (isValueNode) {
    const type = Object.keys(values).pop()
    const value = values[type]
    if (ES_BUILTIN_TYPES.has(typeof value)) return value
    const remote = nextRemoteObject(context, value)
    if ($meta) {
      context.put($meta.that, remote)
      return getProxy($meta.that)
    }
    return remote
  }

  if (Array.isArray(obj)) {
    return obj.map(
      (item) => nextRemoteObject(context, item))
  }

  const res = {}
  Object.keys(values)
    .forEach((key) => { res[key] = nextRemoteObject(context, values[key]) })

  if (res === {}) return { ...values }
  return res
}

const Context = (connection) => ({
  connection,
  // Maps ID of a pending call to Call instance
  pendingCalls: new Map(),
  // Maps ID of a remote object to local instance
  instances: new Map(),
  // that : id of remote object
  // name : method name
  // args : array of arguments to be passed
  put(that, value) {
    if (this.instances.has(that)) log.info(`Updating instance with id=${that}`)
    this.instances.set(that, value)
  },
  // TODO: if not found, try to retrieve from remote?
  get(that) {
    if (!this.instances.has(that)) {
      log.info(`Local instance with id=${that} is missing`)
      return undefined
    }
    return this.instances.get(that)
  },

  callRemoteMethod(that, name, args) {
    const id = uuidV4()
    const removePending = (v) => this.pendingCalls.delete(id) && v
    const promise = new Promise((resolve, reject) => {
      if (typeof name === 'symbol') return resolve(undefined)
      if (SPECIAL_FUNCTION_NAMES.has(name)) {
        log.warn(`Not dispatching ES special function ${name}()`)
        return resolve(undefined)
      }
      this.pendingCalls.set(id, this.Call(id, resolve, reject))
      log.info(`Calling ${name}(${args})`)
      try {
        this.connection.send(JSON.stringify({ id, name, that, args }))
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
      const $meta = message.$meta
      switch ($meta.type) {
        case CALL_ACK_MESSAGE:
          clearTimeout(this.timer)
          if (this.state !== DISPATCHED) {
            reject('Received unexpected ACK')
          }
          this.state = ACKNOWLEDGED
          this.timer = setTimeout(
            () => reject('Timed out waiting for result'), CALL_RESULT_TIMEOUT)
          break
        case CALL_RESULT_MESSAGE:
          clearTimeout(this.timer)
          if (this.state !== ACKNOWLEDGED) {
            reject('Received result without call being ACKed first')
          }
          this.state = RETURNED
          resolve(message)
          break
        default:
          reject(`Unknown message type: ${$meta.type}`)
      }
    }
  }),
  // Dispatch message to one of the Calls pending
  dispatch(message) {
    const id = message.$meta.id
    const call = this.pendingCalls.get(id)
    if (!call) {
      log.error(`Call with id=${id} was never issued`)
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
  register()
  return { promise, socket }
}

const Client = (connection, notify) => {
  const context = Context(connection)

  return new Promise((resolve, reject) => {
    setTimeout(
      () => reject('Handshake timeout'),
      HANDSHAKE_TIMEOUT)
    process.nextTick(() => connection.addEventListener(
      'message', (event) => {
        try {
          const message = JSON.parse(event.data)
          log.info(`Received message: ${JSON.stringify(message)}`)
          const $meta = message.$meta
          switch ($meta.type) {
            case CONTROL_MESSAGE:
              return resolve(RemoteObject(context, message))
            case NOTIFICATION_MESSAGE:
              log.info(`Notification: ${message}`)
              notify(message)
              break
            default:
              context.dispatch(message)
          }
        } catch (e) {
          return reject(e)
        }
      }
    ))
  })
}

export default { Connection, Client, Context, RemoteObject }
