import winston from 'winston'
import uuidV4 from 'uuid/v4'
import WebSocket from 'ws'

const log = winston

const CALL_RESULT_MESSAGE = 0
const CALL_ACK_MESSAGE = 1
const NOTIFICATION_MESSAGE = 2
const CONTROL_MESSAGE = 3

const HANDSHAKE_TIMEOUT = 1000
const CONNECTION_TIMEOUT = 1000
const CALL_RESULT_TIMEOUT = 10000

// To prevent from dispatching these calls to the remote
// TODO: need to be mindful of not naming your remote methods the same
const SPECIAL_FUNCTION_NAMES = ['then', 'inspect']

const BuildProxy = (obj, connection) =>
  new Proxy(
    obj,
    {
      // Trap attempts to access object's properties
      get: (target, name) => {
        // Then check if object we are proxying has a field
        const val = target[name] || target.payload[name]
        if (val) return val

        // Don't try to dispatch symbols since the don't belong to Python
        const nameType = typeof name
        if (nameType === 'symbol') return undefined

        if (SPECIAL_FUNCTION_NAMES.indexOf(name) > -1) {
          log.warn(`${name}() is a special function. Not dispatching.`)
          return undefined
        }

        // name can be Symbol which can't be used in concatenation hence .toString()
        log.info(`Will dispatch a remote call: Target = ${target}, name = ${name.toString()}, typeof name = ${nameType}`)

        // If not, assume it's a function call
        return ((...args) => callRemoteMethod(connection, target.that, name, args))
      }
    }
  )

// Accept url and notification handler
const connect = (url, notify) => {
  const connection = new WebSocket(url)

  const rootObj = {
    that: null,
    payload: {},
    disconnect: () => connection.close()
  }

  const connectionPromise = new Promise((resolve, reject) => {
    setTimeout(
      () => reject(
        `Timed out after ${CONNECTION_TIMEOUT} msec while connecting to ${url}`
      ),
      CONNECTION_TIMEOUT)
    connection.on('open', () => {
      resolve()
    })
    connection.on('error', (error) => {
      reject(error)
    })
  })

  return connectionPromise.then(() =>
    new Promise((resolve, reject) => {
      const proxy = BuildProxy(rootObj, connection)

      setTimeout(
        () => reject(`Handshake timed out after ${HANDSHAKE_TIMEOUT} msec`),
        HANDSHAKE_TIMEOUT)

      connection.addEventListener('message', (event) => {
        const message = JSON.parse(event.data)
        switch (message.type) {
          // Upon connect server will send us it's own id
          case CONTROL_MESSAGE:
            rootObj.that = message.that
            resolve(proxy)
            break
          case NOTIFICATION_MESSAGE:
            log.info(`Received notification: ${message.payload}`)
            notify(message)
            break
          case CALL_RESULT_MESSAGE || CALL_ACK_MESSAGE:
            log.info(`Received message of type ${message.type} in root listener, skipping`)
            break
          default:
            log.error(`Invalid message type ${message.type}`)
        }
      })
    })
  )
}

const callRemoteMethod = (connection, that, name, payload) => {
  log.info(`Calling ${name}(${payload}) from ${connection}`)

  return new Promise((resolve, reject) => {
    const id = uuidV4()
    const unsubscribe = () => connection.removeEventListener('message', callHandler)
    const callHandler = (event) => {
      const message = JSON.parse(event.data)

      log.debug(`Received: ${message}`)

      if (message.id !== id) return

      switch (message.type) {
        case CALL_ACK_MESSAGE:
          log.info(`Call acknowledged ${id}`)
          break
        case CALL_RESULT_MESSAGE:
          log.info(`Call result received ${id} : ${message.payload}`)
          unsubscribe()
          if (message.status === 'success') {
            resolve(BuildProxy({ payload: message.payload, that: message.that }, connection))
          } else {
            reject(message.payload)
          }
          break
        default:
          log.error(`Ignoring message type ${message.type} here`)
      }
    }

    connection.addEventListener('message', callHandler)
    connection.send(JSON.stringify({ id, name, that, payload }))

    setTimeout(
      () => {
        unsubscribe()
        reject(`Timed out after ${CALL_RESULT_TIMEOUT} msec while waiting for remote call to return`)
      },
      CALL_RESULT_TIMEOUT
    )
  })
}

export default connect
