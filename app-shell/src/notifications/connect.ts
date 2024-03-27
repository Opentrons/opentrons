import mqtt from 'mqtt'

import { connectionStore } from './store'
import {
  sendDeserialized,
  sendDeserializedGenericError,
  deserializeExpectedMessages,
} from './deserialize'
import { unsubscribe } from './unsubscribe'
import { notifyLog } from './notifyLog'
import { FAILURE_STATUSES, HEALTH_STATUS_OK } from '../constants'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'
import type { DiscoveryClientRobot } from '@opentrons/discovery-client'

// MQTT is somewhat particular about the clientId format and will connect erratically if an unexpected string is supplied.
const CLIENT_ID = 'app-' + Math.random().toString(16).slice(2, 8) // Derived from mqttjs
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
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const healthyRobotNames = healthyRobots.map(({ robotName }) => robotName)
    const healthyRobotNamesSet = new Set(healthyRobotNames)
    const unreachableRobots = connectionStore
      .getAllBrokersInStore()
      .filter(robotName => {
        return !healthyRobotNamesSet.has(robotName)
      })
    void closeConnectionsForcefullyFor(unreachableRobots)
    resolve(unreachableRobots)
  })
}

export function establishConnections(
  healthyRobots: RobotData[]
): Promise<RobotData[]> {
  return new Promise((resolve, reject) => {
    const newConnections = healthyRobots.filter(({ ip, robotName }) => {
      if (connectionStore.isConnectedToBroker(robotName)) {
        return false
      } else {
        connectionStore.associateIPWithRobotName(ip, robotName)
        // True when a robot is connecting.
        if (!connectionStore.isConnectionTerminated(robotName)) {
          return false
        } else {
          return !connectionStore.isKnownPortBlockedIP(ip)
        }
      }
    })
    newConnections.forEach(({ ip, robotName }) => {
      void connectionStore
        .setPendingConnection(robotName)
        .then(() => {
          connectAsync(`mqtt://${ip}`)
            .then(client => {
              notifyLog.debug(`Successfully connected to ${robotName} on ${ip}`)
              void connectionStore
                .setConnected(robotName, client)
                .then(() => establishListeners(client, ip, robotName))
                .catch((error: Error) => notifyLog.debug(error.message))
            })
            .catch((error: Error) => {
              notifyLog.warn(
                `Failed to connect to ${robotName} on ${ip} - ${error.name}: ${error.message} `
              )
              void connectionStore.setErrorStatus(ip, error.message)
            })
        })
        .catch((error: Error) => notifyLog.debug(error.message))
    })
    resolve(newConnections)
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

function establishListeners(
  client: mqtt.MqttClient,
  ip: string,
  robotName: string
): void {
  client.on(
    'message',
    (topic: NotifyTopic, message: Buffer, packet: mqtt.IPublishPacket) => {
      deserializeExpectedMessages(message.toString())
        .then(deserializedMessage => {
          const messageContainsUnsubFlag = 'unsubscribe' in deserializedMessage
          if (messageContainsUnsubFlag) {
            void unsubscribe(ip, topic).catch((error: Error) =>
              notifyLog.debug(error.message)
            )
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
    notifyLog.debug(`Attempting to reconnect to ${robotName} on ${ip}`)
  })
  // handles transport layer errors only
  client.on('error', error => {
    notifyLog.warn(`Error - ${error.name}: ${error.message}`)
    sendDeserializedGenericError(ip, 'ALL_TOPICS')
    client.end()
  })

  client.on('end', () => {
    notifyLog.debug(`Closed connection to ${robotName} on ${ip}`)
    // Marking the connection as failed with a generic error status lets the connection re-establish in the future
    // and tells the browser to fall back to polling (assuming this 'end' event isn't caused by the app closing).
    void connectionStore.setErrorStatus(ip, FAILURE_STATUSES.ECONNFAILED)
  })

  client.on('disconnect', packet => {
    notifyLog.warn(
      `Disconnected from ${robotName} on ${ip} with code ${
        packet.reasonCode ?? 'undefined'
      }`
    )
    sendDeserializedGenericError(ip, 'ALL_TOPICS')
  })
}

export function closeConnectionsForcefullyFor(
  robotNames: string[]
): Array<Promise<void>> {
  return robotNames.map(ip => {
    const client = connectionStore.getClient(ip)
    return new Promise<void>((resolve, reject) => {
      if (client != null) {
        client.end(true, {}, () => resolve())
      }
    })
  })
}
