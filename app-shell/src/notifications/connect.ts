import mqtt from 'mqtt'

import { connectionStore } from './store'
import {
  sendDeserialized,
  sendDeserializedGenericError,
  deserializeExpectedMessages,
} from './deserialize'
import { unsubscribe } from './unsubscribe'
import { notifyLog } from './notifyLog'
import { HEALTH_STATUS_OK } from '../constants'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'
import type { DiscoveryClientRobot } from '@opentrons/discovery-client'

// MQTT is somewhat particular about the clientId format and will connect erratically if an unexpected string is supplied.
const CLIENT_ID = 'app-' + Math.random().toString(16).slice(2, 8) // Derived from the mqttjs library.
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

export interface RobotData {
  ip: string
  robotName: string
}

// This is the discovery-client equivalent of "available" robots when viewing the Devices page in the app.
export function getHealthyRobotDataForNotifyConnections(
  robots: DiscoveryClientRobot[]
): RobotData[] {
  return robots.flatMap(robot =>
    robot.addresses
      .filter(address => address.healthStatus === HEALTH_STATUS_OK)
      .map(address => ({ ip: address.ip, robotName: robot.name }))
  )
}

/**
 *
 * @description Remove broker connections from the connection store by forcibly disconnecting from brokers
 * as robots are no longer discoverable.
 */
export function cleanUpUnreachableRobots(
  healthyRobots: RobotData[]
): Promise<void> {
  return new Promise(() => {
    const healthyRobotIPs = healthyRobots.map(({ ip }) => ip)
    const healthyRobotIPsSet = new Set(healthyRobotIPs)
    const unreachableRobots = connectionStore
      .getReachableHosts()
      .filter(hostname => {
        return !healthyRobotIPsSet.has(hostname)
      })
    void closeConnectionsForcefullyFor(unreachableRobots)
  })
}

export function addNewRobotsToConnectionStore(
  healthyRobots: RobotData[]
): Promise<void> {
  return new Promise(() => {
    const newRobots = healthyRobots.filter(({ ip, robotName }) => {
      const isNewIP = connectionStore.isIPNewlyDiscovered(ip)
      const isIPAssociatedWithKnownRobot = connectionStore.isAssociatedWithExistingHostData(
        robotName
      )
      // Not a new robot, but a new IP for a robot present in connectionStore.
      if (isNewIP && isIPAssociatedWithKnownRobot) {
        // Pass until the next discovery-client poll so the current connection can resolve.
        if (!connectionStore.isAssociatedBrokerConnected(ip)) {
          return false
        }
        // Robot is reachable on an associated IP. Do not connect on this IP.
        if (connectionStore.isAssociatedBrokerReachable(ip)) {
          connectionStore.associateIPWithExistingHostData(ip, robotName)
          return false
        }
        // The broker isn't reachable on existing IPs.
        // Mark this IP as a new broker connection to see if the broker is reachable on this IP.
        else {
          connectionStore.deleteAllAssociatedIPsGivenRobotName(robotName)
          return true
        }
      } else {
        return isNewIP
      }
    })
    newRobots.forEach(({ ip, robotName }) => {
      connectionStore.setPendingConnection(ip, robotName)
      connectAsync(`mqtt://${ip}`)
        .then(client => {
          notifyLog.debug(`Successfully connected to ${ip}`)
          connectionStore.setConnected(ip, client)
          establishListeners({ client, ip: ip })
        })
        .catch((error: Error) => {
          notifyLog.warn(
            `Failed to connect to ${ip} - ${error.name}: ${error.message} `
          )
          connectionStore.setFailedConnection(ip, error)
        })
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
  ip,
}: {
  client: mqtt.MqttClient
  ip: string
}): void {
  client.on(
    'message',
    (topic: NotifyTopic, message: Buffer, packet: mqtt.IPublishPacket) => {
      deserializeExpectedMessages(message.toString())
        .then(deserializedMessage => {
          const messageContainsUnsubFlag = 'unsubscribe' in deserializedMessage
          if (messageContainsUnsubFlag) {
            void unsubscribe(ip, topic)
          }

          notifyLog.debug('Received notification data from main via IPC', {
            ip,
            topic,
          })

          sendDeserialized({ ip, topic, message: deserializedMessage })
        })
        .catch(error => notifyLog.debug(`${error.message}`))
    }
  )

  client.on('reconnect', () => {
    notifyLog.debug(`Attempting to reconnect to ${ip}`)
  })
  // handles transport layer errors only
  client.on('error', error => {
    notifyLog.warn(`Error - ${error.name}: ${error.message}`)
    sendDeserializedGenericError(ip, 'ALL_TOPICS')
    client.end()
  })

  client.on('end', () => {
    notifyLog.debug(`Closed connection to ${ip}`)
  })

  client.on('disconnect', packet => {
    notifyLog.warn(
      `Disconnected from ${ip} with code ${packet.reasonCode ?? 'undefined'}`
    )
    sendDeserializedGenericError(ip, 'ALL_TOPICS')
  })
}

export function closeConnectionsForcefullyFor(
  hosts: string[]
): Array<Promise<void>> {
  return hosts.map(hostname => {
    const client = connectionStore.getClient(hostname)
    return new Promise<void>((resolve, reject) => {
      if (client != null) {
        client.end(true, {})
      }
      connectionStore.deleteAllAssociatedIPsGivenIP(hostname)
      resolve()
    })
  })
}
