/* eslint-disable @typescript-eslint/no-dynamic-delete */
import mqtt from 'mqtt'
import isEqual from 'lodash/isEqual'

import { createLogger } from './log'
import { FAILURE_STATUSES, HEALTH_STATUS_OK } from './constants'

import type { BrowserWindow } from 'electron'
import type {
  NotifyBrokerResponses,
  NotifyNetworkError,
  NotifyRefetchData,
  NotifyResponseData,
  NotifyTopic,
  NotifyUnsubscribeData,
} from '@opentrons/app/lib/redux/shell/types'
import type { DiscoveryClientRobot } from '@opentrons/discovery-client'

// Manages MQTT broker connections through a connection store. Broker connections are added or removed based on
// health status changes reported by discovery-client. Subscriptions are handled "lazily", in which a component must
// express interest in a topic before a subscription request is made. Unsubscribe requests only occur if an "unsubscribe"
// flag is received from the broker. Pending subs and unsubs are used to prevent unnecessary network and broker load.

interface HostnameInfo {
  client: mqtt.MqttClient | null
  subscriptions: Set<NotifyTopic>
  pendingSubs: Set<NotifyTopic>
}
interface ConnectionStore {
  unreachableHosts: Set<string>
  pendingUnsubs: Set<NotifyTopic>
  robotsWithReportedPortBlockEvent: Set<string>
  hostnames: Record<string, HostnameInfo>
  browserWindow: BrowserWindow | null
}
export const connectionStore: ConnectionStore = {
  unreachableHosts: new Set(),
  pendingUnsubs: new Set(),
  robotsWithReportedPortBlockEvent: new Set(),
  hostnames: {},
  browserWindow: null,
}

const CHECK_CONNECTION_INTERVAL = 500
const VALID_NOTIFY_RESPONSES: [NotifyRefetchData, NotifyUnsubscribeData] = [
  { refetchUsingHTTP: true },
  { unsubscribe: true },
]
// MQTT is somewhat particular about the clientId format and will connect erratically if an unexpected string is supplied.
// This clientId is derived from the mqttjs library.
const CLIENT_ID = 'app-' + Math.random().toString(16).slice(2, 8)
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
  a render update event if duplicate data is received, we can avoid the additional overhead of guaranteeing "exactly once" delivery.
 */
const subscribeOptions: mqtt.IClientSubscribeOptions = {
  qos: 1,
}

const log = createLogger('notify')

// Correct and make sure everything can work. What are the transitiions I actually need?
// Subscribing. If host IS UNREACHABLE, then return. Otherwise, HANDLE SUBSCRIPTION.
// HANDLE SUB-> If IS CONNECTED, IS SUBSCRIBED (do subscribe pending logic here if not).
// Pretty much same flow for unsubscribe. The key is to implictly move stuff between states.
// Any state transition should be encapsulated.
export function handleNotificationConnectionsFor(
  robots: DiscoveryClientRobot[]
): string[] {
  const reachableRobotIPs = getHealthyRobotIPsForNotifications(robots)
  cleanUpUnreachableRobots(reachableRobotIPs)
  addNewRobotsToConnectionStore(reachableRobotIPs)

  return reachableRobotIPs
}

// This is the discovery-client equivalent of "available" robots when viewing the Devices page in the app.
function getHealthyRobotIPsForNotifications(
  robots: DiscoveryClientRobot[]
): string[] {
  return robots.flatMap(robot =>
    robot.addresses
      .filter(address => address.healthStatus === HEALTH_STATUS_OK)
      .map(address => address.ip)
  )
}

function cleanUpUnreachableRobots(healthyRobotIPs: string[]): void {
  const healthyRobotIPsSet = new Set(healthyRobotIPs)
  const unreachableRobots = Object.keys(connectionStore).filter(hostname => {
    // The connection is forcefully closed, so remove from the connection store immediately to reduce disconnect packets.
    if (hostname in connectionStore && !healthyRobotIPsSet.has(hostname)) {
      delete connectionStore[hostname]
      unreachableHosts.delete(hostname)
      return true
    }
    return false
  })
  void closeConnectionsForcefullyFor(unreachableRobots)
}

function addNewRobotsToConnectionStore(robots: string[]): void {
  const newRobots = robots.filter(hostname => {
    const isRobotInConnectionStore = Object.prototype.hasOwnProperty.call(
      connectionStore,
      hostname
    )
    return !isRobotInConnectionStore && !unreachableHosts.has(hostname)
  })
  newRobots.forEach(hostname => {
    connectAsync(`mqtt://${hostname}`)
      .then(client => {
        log.debug(`Successfully connected to ${hostname}`)
        connectionStore[hostname] = {
          client,
          subscriptions: new Set(),
          pendingSubs: new Set(),
        }
        establishListeners({ client, hostname })
      })
      .catch((error: Error) => {
        log.warn(
          `Failed to connect to ${hostname} - ${error.name}: ${error.message} `
        )
        unreachableHosts.add(hostname)
      })
  })
}

function subscribe({
  hostname,
  topic,
}: {
  hostname: string
  topic: NotifyTopic
}): Promise<void> {
  if (unreachableHosts.has(hostname)) {
    const errorMessage = determineErrorMessageFor(hostname)
    sendToBrowserDeserialized({
      hostname,
      topic,
      message: errorMessage,
    })

    return Promise.resolve()
  } else {
    return waitUntilActiveOrErrored('client')
      .then(() => {
        // Break this guy out into a function IMO.
        const { client, subscriptions, pendingSubs } = connectionStore[hostname]
        if (!subscriptions.has(topic)) {
          if (!pendingSubs.has(topic)) {
            pendingSubs.add(topic)
            return new Promise<void>(() => {
              client?.subscribe(topic, subscribeOptions, subscribeCb)
              pendingSubs.delete(topic)
            })
          } else {
            void waitUntilActiveOrErrored('subscription').catch(
              (error: Error) => {
                log.debug(error.message)
                sendToBrowserDeserialized({
                  hostname,
                  topic,
                  message: FAILURE_STATUSES.ECONNFAILED,
                })
              }
            )
          }
        }
      })
      .catch((error: Error) => {
        log.debug(error.message)
        sendToBrowserDeserialized({
          hostname,
          topic,
          message: FAILURE_STATUSES.ECONNFAILED,
        })
      })
  }
}

// Only send one ECONNREFUSED per robot per app session.
function determineErrorMessageFor(hostname: string): NotifyNetworkError {
  let message: NotifyNetworkError
  if (!robotsWithReportedPortBlockEvent.has(hostname)) {
    message = FAILURE_STATUSES.ECONNREFUSED
    robotsWithReportedPortBlockEvent.add(hostname)
  } else {
    message = FAILURE_STATUSES.ECONNFAILED
  }
  return message
}

function subscribeCb(error: Error, result: mqtt.ISubscriptionGrant[]): void {
  const { subscriptions } = connectionStore[hostname]
  if (error != null) {
    sendToBrowserDeserialized({
      hostname,
      topic,
      message: FAILURE_STATUSES.ECONNFAILED,
    })
  } else {
    log.debug(`Successfully subscribed on ${hostname} to topic: ${topic}`)
    subscriptions.add(topic)
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
          ? host.client != null
          : host.subscriptions.has(topic)
      if (hasReceivedAck) {
        clearInterval(intervalId)
        resolve()
      }

      counter++
      if (counter === MAX_RETRIES) {
        clearInterval(intervalId)
        reject(new Error('Maximum number of retries exceeded.'))
      }
    }, CHECK_CONNECTION_INTERVAL)
  })
}

function checkForUnsubscribeFlag(
  deserializedMessage: NotifyBrokerResponses,
  hostname: string,
  topic: NotifyTopic
): void {
  const messageContainsUnsubFlag = 'unsubscribe' in deserializedMessage
  if (messageContainsUnsubFlag) {
    void unsubscribe(hostname, topic)
  }
}

function unsubscribe(hostname: string, topic: NotifyTopic): Promise<void> {
  return new Promise<void>(() => {
    if (!pendingUnsubs.has(topic)) {
      if (connectionStore[hostname].subscriptions.has(topic)) {
        pendingUnsubs.add(topic)
        const { client } = connectionStore[hostname]
        client?.unsubscribe(topic, {}, (error, result) => {
          if (error != null) {
            log.debug(
              `Failed to unsubscribe on ${hostname} from topic: ${topic}`
            )
          } else {
            log.debug(
              `Successfully unsubscribed on ${hostname} from topic: ${topic}`
            )
            const { subscriptions } = connectionStore[hostname]
            subscriptions.delete(topic)
            pendingUnsubs.delete(topic)
          }
        })
      } else {
        log.debug(
          `Host ${hostname} to unsubscribe from unsubscribed topic: ${topic}`
        )
      }
    }
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

function establishListeners({
  client,
  hostname,
}: {
  client: mqtt.MqttClient
  hostname: string
}): void {
  client.on(
    'message',
    (topic: NotifyTopic, message: Buffer, packet: mqtt.IPublishPacket) => {
      deserialize(message.toString())
        .then(deserializedMessage => {
          checkForUnsubscribeFlag(deserializedMessage, hostname, topic)

          log.debug('Received notification data from main via IPC', {
            hostname,
            topic,
          })
          try {
            browserWindow.webContents.send(
              'notify',
              hostname,
              topic,
              deserializedMessage
            )
          } catch {}
        })
        .catch(error => log.debug(`${error.message}`))
    }
  )

  client.on('reconnect', () => {
    log.debug(`Attempting to reconnect to ${hostname}`)
  })
  // handles transport layer errors only
  client.on('error', error => {
    log.warn(`Error - ${error.name}: ${error.message}`)
    sendToBrowserDeserialized({
      hostname,
      topic: 'ALL_TOPICS',
      message: FAILURE_STATUSES.ECONNFAILED,
    })
    client.end()
  })

  client.on('end', () => {
    log.debug(`Closed connection to ${hostname}`)
    sendToBrowserDeserialized({
      hostname,
      topic: 'ALL_TOPICS',
      message: FAILURE_STATUSES.ECONNFAILED,
    })
  })

  client.on('disconnect', packet => {
    log.warn(
      `Disconnected from ${hostname} with code ${
        packet.reasonCode ?? 'undefined'
      }`
    )
    sendToBrowserDeserialized({
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
    const closeConnections = closeConnectionsForcefullyFor(
      Object.keys(connectionStore)
    )
    Promise.all(closeConnections).then(resolve).catch(reject)
  })
}

function closeConnectionsForcefullyFor(hosts: string[]): Array<Promise<void>> {
  return hosts.map(hostname => {
    const client = connectionStore[hostname].client
    return new Promise<void>((resolve, reject) =>
      client?.end(true, {}, () => resolve())
    )
  })
}

interface SendToBrowserParams {
  hostname: string
  topic: NotifyTopic
  message: NotifyResponseData
}

function sendToBrowserDeserialized({
  hostname,
  topic,
  message,
}: SendToBrowserParams): void {
  try {
    browserWindow.webContents.send('notify', hostname, topic, message)
  } catch {}
}

function deserialize(message: string): Promise<NotifyBrokerResponses> {
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

    const isValidNotifyResponse = VALID_NOTIFY_RESPONSES.some(model =>
      isEqual(model, deserializedMessage)
    )
    if (!isValidNotifyResponse) {
      reject(error)
    } else {
      resolve(JSON.parse(message))
    }
  })
}
