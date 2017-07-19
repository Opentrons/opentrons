import winston from 'winston'
import uuidV4 from 'uuid/v4'
import WebSocket from 'ws'

const log = winston

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
// TODO: need to be mindful of not naming your remote methods the same
const SPECIAL_FUNCTION_NAMES = ['then', 'inspect']
const ES_BUILTIN_TYPES = ['string', 'number', 'boolean', 'undefined']

// As there is no way to tell if an object is a proxy need this
class Remote {}

// TODO: pass root proxy around
const BuildProxy = (obj, context) => {
  // if it's a built in, no need to proxy it
  if (ES_BUILTIN_TYPES.indexOf(typeof obj.payload.value) > -1) return obj.payload.value

  // if it's an array, build an array of proxies and return
  if (Array.isArray(obj)) return obj.map(item => BuildProxy(item, context))

  return new Proxy(obj, // <- object we are proxying
    {
      // Use this to help client code determine if it's a proxy
      getPrototypeOf: () => Remote.prototype,

      // Trap attempts to access object's properties
      get: (target, name) => {
        // check if object we are proxying has a property
        const val = target.payload.value[name]

        // If this property is already a proxy itself, return it
        if (val instanceof Remote) return val

        if (val) {
          // Fix by disabling no-param-reassign linting check?
          target.payload.value[name] = BuildProxy(val, context)
          return target.payload.value[name]
        }

        // Don't try to dispatch symbols since the don't belong to Python
        if (typeof name === 'symbol') return undefined

        if (SPECIAL_FUNCTION_NAMES.indexOf(name) > -1) {
          log.warn(`${name}() is a special function. Not dispatching.`)
          return undefined
        }

        // name can be Symbol which can't be used in concatenation hence .toString()
        log.info(`Will dispatch a remote call: ${target.$meta.type}.${name.toString()}`)

        // If not, assume it's a function call
        return ((...args) => callRemoteMethod(context, target.$meta.that, name, args))
      }
    }
  )
}

// Initialize
const init = (connection, notify) => {
  const context = {
    connection,
    pending: {}
  }

  const rootObj = {
    $meta: { that: null },
    payload: { value: {} },
    disconnect: () => connection.close(),
  }

  return new Promise((resolve, reject) => {
    setTimeout(
      () => reject(`Handshake timed out after ${HANDSHAKE_TIMEOUT} msec`),
      HANDSHAKE_TIMEOUT)

    connection.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      log.debug(`Received message: ${JSON.stringify(message)}`)

      const $meta = message.$meta
      const pending = context.pending
      const id = $meta.id

      // The response has id but we don't have a call pending
      if (id && !(id in pending)) {
        log.error(`Received a response with id ${id} whilch we never dispatched`)
        return
      }

      switch ($meta.type) {
        // Init root object with initial state of remote server
        case CONTROL_MESSAGE:
          resolve(
            BuildProxy({
              ...message,
              disconnect: () => connection.close()
            }, context))
          break
        // Pass notifications to notify() handler
        case NOTIFICATION_MESSAGE:
          log.info(`Received notification: ${message}`)
          notify(message)
          break
        case CALL_RESULT_MESSAGE:
          // Clear wait for result timeout
          clearTimeout(pending[id].timer)
          if ($meta.status === 'success') {
            pending[id].resove(BuildProxy(message, context))
          } else {
            pending[id].reject(message)
          }
          break
        case CALL_ACK_MESSAGE:
          log.info(`Received message ACK for id ${id}`)
          // Clear call ACK timeout
          clearTimeout(pending[id].timer)
          // Start waiting for the result
          pending[id].timer = setTimeout(
            () =>
              pending[id].reject(`Waiting for result ${id}: timed out after ${CALL_RESULT_TIMEOUT} msec`),
            CALL_RESULT_TIMEOUT
          )
          break
        default:
          log.error(`Invalid message type ${$meta.type}`)
      }
    })
  })
}

// Accept url and notification handler
const connect = (url, notify) => {
  const connection = new WebSocket(url)

  const tryConnect = new Promise((resolve, reject) => {
    setTimeout(
      () => reject(
        `Timed out after ${CONNECTION_TIMEOUT} msec while connecting to ${url}`
      ),
      CONNECTION_TIMEOUT)
    connection.on('open', () => resolve())
    connection.on('error', (error) => reject(error))
  })

  return tryConnect.then(() => init(connection, notify))
}

const callRemoteMethod = (context, that, name, args) => {
  const id = uuidV4()
  let handlers = null
  const promise = new Promise((resolve, reject) => {
    handlers = { resolve, reject }
    context.pending[id] = handlers
  })

  handlers.timer = setTimeout(
    () =>
      handlers.reject(`Waiting for call to be acknoleged: timed out after ${CALL_ACK_TIMEOUT} msec`),
    CALL_ACK_TIMEOUT
  )

  log.info(`Calling ${name}(${args}) from ${context.connection}`)

  try {
    context.connection.send(JSON.stringify({ id, name, that, args }))
  } catch (e) {
    handlers.reject(e)
  }

  return promise
}

export default connect
