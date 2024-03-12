/* eslint-disable @typescript-eslint/no-dynamic-delete */
import mqtt from 'mqtt'
import isEqual from 'lodash/isEqual'

import { createLogger } from './log'

import type { BrowserWindow } from 'electron'
import type {
  NotifyTopic,
  NotifyResponseData,
  NotifyRefetchData,
  NotifyUnsubscribeData,
  NotifyNetworkError,
} from '@opentrons/app/src/redux/shell/types'
import type { Action, Dispatch } from './types'

// TODO(jh, 2024-03-01): after refactoring notify connectivity and subscription logic, uncomment logs.

// Manages MQTT broker connections via a connection store, establishing a connection to the broker only if a connection does not
// already exist, and disconnects from the broker when the app is not subscribed to any topics for the given broker.
// A redundant connection to the same broker results in the older connection forcibly closing, which we want to avoid.
// However, redundant subscriptions are permitted and result in the broker sending the retained message for that topic.
// To mitigate redundant connections, the connection manager eagerly adds the host, removing the host if the connection fails.

const FAILURE_STATUSES = {
  ECONNREFUSED: 'ECONNREFUSED',
  ECONNFAILED: 'ECONNFAILED',
} as const

interface ConnectionStore {
  [hostname: string]: {
    client: mqtt.MqttClient | null
    subscriptions: Record<NotifyTopic, number>
    pendingSubs: Set<NotifyTopic>
  }
}

const connectionStore: ConnectionStore = {}
const unreachableHosts = new Set<string>()
const log = createLogger('notify')
// MQTT is somewhat particular about the clientId format and will connect erratically if an unexpected string is supplied.
// This clientId is derived from the mqttjs library.
const CLIENT_ID = 'odd-' + Math.random().toString(16).slice(2, 8)

const connectOptions: mqtt.IClientOptions = {
  clientId: CLIENT_ID,
  port: 1883,
  keepalive: 60,
  protocolVersion: 5,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  clean: true,
  resubscribe: true,
}

/**
 * @property {number} qos: "Quality of Service", "at least once". Because we use React Query, which does not trigger
  a render update event if duplicate data is received, we can avoid the additional overhead
  to guarantee "exactly once" delivery.
 */
const subscribeOptions: mqtt.IClientSubscribeOptions = {
  qos: 1,
}

export function registerNotify(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): (action: Action) => unknown {
  return function handleAction(action: Action) {
    switch (action.type) {
      case 'shell:NOTIFY_SUBSCRIBE':
        return subscribe({
          ...action.payload,
          browserWindow: mainWindow,
          hostname: '127.0.0.1',
        })

      case 'shell:NOTIFY_UNSUBSCRIBE':
        return unsubscribe({
          ...action.payload,
          browserWindow: mainWindow,
          hostname: '127.0.0.1',
        })
    }
  }
}

const CHECK_CONNECTION_INTERVAL = 500
let hasReportedAPortBlockEvent = false

interface NotifyParams {
  browserWindow: BrowserWindow
  hostname: string
  topic: NotifyTopic
}

function subscribe(notifyParams: NotifyParams): Promise<void> {
  const { hostname, topic, browserWindow } = notifyParams
  if (unreachableHosts.has(hostname)) {
    sendToBrowserDeserialized({
      browserWindow,
      hostname,
      topic,
      message: FAILURE_STATUSES.ECONNFAILED,
    })
    return Promise.resolve()
  }
  // true if no subscription (and therefore connection) to host exists
  else if (connectionStore[hostname] == null) {
    connectionStore[hostname] = {
      client: null,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      subscriptions: { [topic]: 1 } as Record<NotifyTopic, number>,
      pendingSubs: new Set(),
    }
    return connectAsync(`mqtt://${hostname}`)
      .then(client => {
        const { pendingSubs } = connectionStore[hostname]
        log.info(`Successfully connected to ${hostname}`)
        connectionStore[hostname].client = client
        pendingSubs.add(topic)
        establishListeners({ ...notifyParams, client })
        return new Promise<void>(() => {
          client.subscribe(topic, subscribeOptions, subscribeCb)
          pendingSubs.delete(topic)
        })
      })
      .catch((error: Error) => {
        log.warn(
          `Failed to connect to ${hostname} - ${error.name}: ${error.message} `
        )
        let failureMessage: NotifyNetworkError = FAILURE_STATUSES.ECONNFAILED
        if (connectionStore[hostname]?.client == null) {
          unreachableHosts.add(hostname)
          if (
            error.message.includes(FAILURE_STATUSES.ECONNREFUSED) &&
            !hasReportedAPortBlockEvent
          ) {
            failureMessage = FAILURE_STATUSES.ECONNREFUSED
            hasReportedAPortBlockEvent = true
          }
        }

        sendToBrowserDeserialized({
          browserWindow,
          hostname,
          topic,
          message: failureMessage,
        })
        if (hostname in connectionStore) delete connectionStore[hostname]
      })
  }
  // true if the connection store has an entry for the hostname.
  else {
    return waitUntilActiveOrErrored('client')
      .then(() => {
        const { client, subscriptions, pendingSubs } = connectionStore[hostname]
        const activeClient = client as mqtt.Client
        const isNotActiveSubscription = (subscriptions[topic] ?? 0) <= 0
        if (!pendingSubs.has(topic) && isNotActiveSubscription) {
          pendingSubs.add(topic)
          return new Promise<void>(() => {
            activeClient.subscribe(topic, subscribeOptions, subscribeCb)
            pendingSubs.delete(topic)
          })
        } else {
          void waitUntilActiveOrErrored('subscription')
            .then(() => {
              subscriptions[topic] += 1
            })
            .catch(() => {
              sendToBrowserDeserialized({
                browserWindow,
                hostname,
                topic,
                message: FAILURE_STATUSES.ECONNFAILED,
              })
            })
        }
      })
      .catch(() => {
        sendToBrowserDeserialized({
          browserWindow,
          hostname,
          topic,
          message: FAILURE_STATUSES.ECONNFAILED,
        })
      })
  }
  function subscribeCb(error: Error, result: mqtt.ISubscriptionGrant[]): void {
    const { subscriptions } = connectionStore[hostname]
    if (error != null) {
      sendToBrowserDeserialized({
        browserWindow,
        hostname,
        topic,
        message: FAILURE_STATUSES.ECONNFAILED,
      })
      setTimeout(() => {
        if (Object.keys(connectionStore[hostname].subscriptions).length <= 0) {
          connectionStore[hostname].client?.end()
        }
      }, RENDER_TIMEOUT)
    } else {
      if (subscriptions[topic] > 0) {
        subscriptions[topic] += 1
      } else {
        subscriptions[topic] = 1
      }
    }
  }

  // Check every 500ms for 2 seconds before failing.
  function waitUntilActiveOrErrored(
    connection: 'client' | 'subscription'
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const MAX_RETRIES = 4
      let counter = 0
      const intervalId = setInterval(() => {
        const host = connectionStore[hostname]
        const hasReceivedAck =
          connection === 'client'
            ? host?.client != null
            : host?.subscriptions[topic] > 0
        if (hasReceivedAck) {
          clearInterval(intervalId)
          resolve()
        }

        counter++
        if (counter === MAX_RETRIES) {
          clearInterval(intervalId)
          reject(new Error('Maximum subscription retries exceeded.'))
        }
      }, CHECK_CONNECTION_INTERVAL)
    })
  }
}

// Because subscription logic is directly tied to the component lifecycle, it is possible
// for a component to trigger an unsubscribe event on dismount while a new component mounts and
// triggers a subscribe event. For the connection store and MQTT to reflect correct topic subscriptions,
// do not unsubscribe and close connections before newly mounted components have had time to update the connection store.
const RENDER_TIMEOUT = 10000 // 10 seconds

function unsubscribe(notifyParams: NotifyParams): Promise<void> {
  const { hostname, topic } = notifyParams
  return new Promise<void>(() => {
    setTimeout(() => {
      if (hostname in connectionStore) {
        const { client } = connectionStore[hostname]
        const subscriptions = connectionStore[hostname]?.subscriptions
        const isLastSubscription = subscriptions[topic] <= 1

        if (isLastSubscription) {
          client?.unsubscribe(topic, {}, (error, result) => {
            if (error == null) {
              handleDecrementSubscriptionCount(hostname, topic)
            } else {
              log.warn(`Failed to subscribe on ${hostname} to topic: ${topic}`)
            }
          })
        } else {
          subscriptions[topic] -= 1
        }
      }
    }, RENDER_TIMEOUT)
  })
}

function connectAsync(brokerURL: string): Promise<mqtt.Client> {
  const client = mqtt.connect(brokerURL, connectOptions)

  return new Promise((resolve, reject) => {
    // Listeners added to client to trigger promise resolution
    const promiseListeners: {
      [key: string]: (...args: any[]) => void
    } = {
      connect: () => {
        removePromiseListeners()
        return resolve(client)
      },
      // A connection error event will close the connection without a retry.
      error: (error: Error | string) => {
        removePromiseListeners()
        const clientEndPromise = new Promise((resolve, reject) =>
          client.end(true, {}, () => resolve(error))
        )
        return clientEndPromise.then(() => reject(error))
      },
      end: () => promiseListeners.error(`Couldn't connect to ${brokerURL}`),
    }

    function removePromiseListeners(): void {
      Object.keys(promiseListeners).forEach(eventName => {
        client.removeListener(eventName, promiseListeners[eventName])
      })
    }

    Object.keys(promiseListeners).forEach(eventName => {
      client.on(eventName, promiseListeners[eventName])
    })
  })
}

function handleDecrementSubscriptionCount(
  hostname: string,
  topic: NotifyTopic
): void {
  const host = connectionStore[hostname]
  if (host) {
    const { client, subscriptions } = host
    if (topic in subscriptions) {
      subscriptions[topic] -= 1
      if (subscriptions[topic] <= 0) {
        delete subscriptions[topic]
      }
    }

    if (Object.keys(subscriptions).length <= 0) {
      client?.end()
    }
  }
}

interface ListenerParams {
  client: mqtt.MqttClient
  browserWindow: BrowserWindow
  hostname: string
}

function establishListeners({
  client,
  browserWindow,
  hostname,
}: ListenerParams): void {
  client.on(
    'message',
    (topic: NotifyTopic, message: Buffer, packet: mqtt.IPublishPacket) => {
      deserialize(message.toString())
        .then(deserializedMessage => {
          log.debug('Received notification data from main via IPC', {
            hostname,
            topic,
          })

          browserWindow.webContents.send(
            'notify',
            hostname,
            topic,
            deserializedMessage
          )
        })
        .catch(error => log.debug(`${error.message}`))
    }
  )

  client.on('reconnect', () => {
    log.info(`Attempting to reconnect to ${hostname}`)
  })
  // handles transport layer errors only
  client.on('error', error => {
    log.warn(`Error - ${error.name}: ${error.message}`)
    sendToBrowserDeserialized({
      browserWindow,
      hostname,
      topic: 'ALL_TOPICS',
      message: FAILURE_STATUSES.ECONNFAILED,
    })
    client.end()
  })

  client.on('end', () => {
    log.info(`Closed connection to ${hostname}`)
    if (hostname in connectionStore) delete connectionStore[hostname]
  })

  client.on('disconnect', packet => {
    log.warn(
      `Disconnected from ${hostname} with code ${
        packet.reasonCode ?? 'undefined'
      }`
    )
    sendToBrowserDeserialized({
      browserWindow,
      hostname,
      topic: 'ALL_TOPICS',
      message: FAILURE_STATUSES.ECONNFAILED,
    })
  })
}

export function closeAllNotifyConnections(): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(Error('Failed to close all connections within the time limit.'))
    }, 2000)

    log.debug('Stopping notify service connections')
    const closeConnections = Object.values(connectionStore).map(
      ({ client }) => {
        return new Promise((resolve, reject) => {
          client?.end(true, {}, () => resolve(null))
        })
      }
    )
    Promise.all(closeConnections).then(resolve).catch(reject)
  })
}

interface SendToBrowserParams {
  browserWindow: BrowserWindow
  hostname: string
  topic: NotifyTopic
  message: NotifyResponseData
}

function sendToBrowserDeserialized({
  browserWindow,
  hostname,
  topic,
  message,
}: SendToBrowserParams): void {
  browserWindow.webContents.send('notify', hostname, topic, message)
}

const VALID_MODELS: [NotifyRefetchData, NotifyUnsubscribeData] = [
  { refetchUsingHTTP: true },
  { unsubscribe: true },
]

function deserialize(message: string): Promise<NotifyResponseData> {
  return new Promise((resolve, reject) => {
    let deserializedMessage: NotifyResponseData | Record<string, unknown>
    const error = new Error(
      `Unexpected data received from notify broker: ${message}`
    )

    try {
      deserializedMessage = JSON.parse(message)
    } catch {
      reject(error)
    }

    const isValidNotifyResponse = VALID_MODELS.some(model =>
      isEqual(model, deserializedMessage)
    )
    if (!isValidNotifyResponse) {
      reject(error)
    } else {
      resolve(JSON.parse(message))
    }
  })
}
