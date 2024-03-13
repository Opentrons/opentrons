import mqtt from 'mqtt'

import { FAILURE_STATUSES, HEALTH_STATUS_OK } from '../constants'
import { connectionStore } from './store'
import { notifyLog } from './log'

import type { NotifyTopic } from '@opentrons/app/lib/redux/shell/types'
import type { DiscoveryClientRobot } from '@opentrons/discovery-client'

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

// This is the discovery-client equivalent of "available" robots when viewing the Devices page in the app.
export function getHealthyRobotIPsForNotifications(
  robots: DiscoveryClientRobot[]
): string[] {
  return robots.flatMap(robot =>
    robot.addresses
      .filter(address => address.healthStatus === HEALTH_STATUS_OK)
      .map(address => address.ip)
  )
}

export function cleanUpUnreachableRobots(healthyRobotIPs: string[]): void {
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

export function addNewRobotsToConnectionStore(robots: string[]): void {
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
        notifyLog.debug(`Successfully connected to ${hostname}`)
        connectionStore[hostname] = {
          client,
          subscriptions: new Set(),
          pendingSubs: new Set(),
        }
        establishListeners({ client, hostname })
      })
      .catch((error: Error) => {
        notifyLog.warn(
          `Failed to connect to ${hostname} - ${error.name}: ${error.message} `
        )
        unreachableHosts.add(hostname)
      })
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

          notifyLog.debug('Received notification data from main via IPC', {
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
        .catch(error => notifyLog.debug(`${error.message}`))
    }
  )

  client.on('reconnect', () => {
    notifyLog.debug(`Attempting to reconnect to ${hostname}`)
  })
  // handles transport layer errors only
  client.on('error', error => {
    notifyLog.warn(`Error - ${error.name}: ${error.message}`)
    sendToBrowserDeserialized({
      hostname,
      topic: 'ALL_TOPICS',
      message: FAILURE_STATUSES.ECONNFAILED,
    })
    client.end()
  })

  client.on('end', () => {
    notifyLog.debug(`Closed connection to ${hostname}`)
    sendToBrowserDeserialized({
      hostname,
      topic: 'ALL_TOPICS',
      message: FAILURE_STATUSES.ECONNFAILED,
    })
  })

  client.on('disconnect', packet => {
    notifyLog.warn(
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

export function closeConnectionsForcefullyFor(
  hosts: string[]
): Array<Promise<void>> {
  return hosts.map(hostname => {
    const client = connectionStore[hostname].client
    return new Promise<void>((resolve, reject) =>
      client?.end(true, {}, () => resolve())
    )
  })
}
