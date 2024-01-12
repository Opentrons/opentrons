/* eslint-disable @typescript-eslint/no-dynamic-delete */
import mqtt from 'mqtt'

import { createLogger } from './log'

import type { BrowserWindow } from 'electron'
import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'
import type { Action, Dispatch } from './types'

// Manages MQTT broker connections via a connection store, establishing a connection to the broker only if a connection does not
// already exist, and disconnects from the broker when the app is not subscribed to any topics for the given broker.
// A redundant connection to the same broker results in the older connection forcibly closing, which we want to avoid.
// However, redundant subscriptions are permitted and result in the broker sending the retained message for that topic.
// To mitigate redundant connections, the connection manager eagerly adds the host, removing the host if the connection fails.

interface ConnectionStore {
  [hostname: string]: {
    client: mqtt.MqttClient | null
    subscriptions: Record<NotifyTopic, number>
  }
}

const connectionStore: ConnectionStore = {}
const log = createLogger('notify')
// MQTT is somewhat particular about the clientId format and will connect erratically if an unexpected string is supplied.
// This clientId is derived from the mqttjs library.
const CLIENT_ID = 'odd_' + Math.random().toString(16).slice(2, 8)

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
 * @property {number} rh: "Retain Handling" enabled. Upon successful subscription, 
  the client will receive the most recent message held by the broker if one is availble.
 */
const subscribeOptions: mqtt.IClientSubscribeOptions = {
  qos: 1,
  rh: 1,
}

export function registerNotify(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): (action: Action) => unknown {
  return function handleAction(action: Action) {
    switch (action.type) {
      // TOME: USING THIS BROKER TO TEST FOR NOW. REMEMBER TO DELETE WHEN USING REAL BROKER.
      case 'shell:NOTIFY_SUBSCRIBE':
        return subscribe({
          ...action.payload,
          browserWindow: mainWindow,
          hostname: 'broker.emqx.io',
        })

      case 'shell:NOTIFY_UNSUBSCRIBE':
        return unsubscribe({ ...action.payload, hostname: 'broker.emqx.io' })
    }
  }
}

interface NotifyParams {
  browserWindow: BrowserWindow
  hostname: string
  topic: NotifyTopic
}

function subscribe(notifyParams: NotifyParams): void {
  const { hostname, topic } = notifyParams
  if (connectionStore[hostname] == null) {
    connectionStore[hostname] = {
      client: null,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      subscriptions: { [topic]: 1 } as Record<NotifyTopic, number>,
    }
    const client = mqtt.connect(`mqtt://${hostname}`, connectOptions)
    connectionStore[hostname].client = client
    establishListeners({ ...notifyParams, client })
    client.subscribe(topic, subscribeOptions)
  } else {
    connectionStore[hostname].subscriptions[topic] += 1
    const { client } = connectionStore[hostname]
    client?.subscribe(topic, subscribeOptions)
  }
}

type UnsubscribeParams = Omit<NotifyParams, 'browserWindow'>

function unsubscribe({ hostname, topic }: UnsubscribeParams): void {
  if (hostname in connectionStore) {
    const { client } = connectionStore[hostname]
    client?.unsubscribe(topic)
  } else {
    log.info(`Attempting to unsubscribe from unconnected hostname ${hostname}`)
  }
}

export function closeAllNotifyConnections(): Promise<unknown[]> {
  log.debug('Stopping all active notify service connections')
  const closeConnections = Object.values(connectionStore).map(({ client }) => {
    return new Promise((resolve, reject) => {
      client?.end(true, {}, () => resolve(null))
    })
  })
  return Promise.all(closeConnections)
}

interface ListenerParams {
  client: mqtt.MqttClient
  browserWindow: BrowserWindow
  topic: NotifyTopic
  hostname: string
}

// See https://docs.oasis-open.org/mqtt/mqtt/v5.0/cos01/mqtt-v5.0-cos01.html
// Packets with reason codes < 128 are successful operations.
function establishListeners({
  client,
  browserWindow,
  hostname,
  topic,
}: ListenerParams): void {
  client.on('message', (topic, message, packet) => {
    browserWindow.webContents.send(
      'notify',
      `${hostname}:${topic}:${message.toString()}`
    )
    log.debug(`Received message: ${hostname}:${topic}:${message.toString()}`)
  })

  client.on('connect', connack => {
    if (connack.reasonCode == null || connack.reasonCode < 128) {
      log.info(`Successfully connected to ${hostname}`)
      client.subscribe(topic, subscribeOptions)
    } else {
      log.warn(`Failed to connect to ${hostname}`)
      browserWindow.webContents.send(
        'notify',
        `${hostname}:${topic}:ECONNFAILED`
      )
      if (hostname in connectionStore) delete connectionStore[hostname]
    }
  })

  client.on('packetreceive', packet => {
    switch (packet.cmd) {
      case 'suback':
        if (packet.reasonCode == null || packet.reasonCode < 128) {
          log.info(`Successfully subscribed on ${hostname} to topic: ${topic}`)
        } else {
          log.warn(`Failed to subscribe on ${hostname} to topic: ${topic}`)
          browserWindow.webContents.send(
            'notify',
            `${hostname}:${topic}:ECONNFAILED`
          )
          decrementSubscription(hostname, topic)
        }
        break

      case 'unsuback':
        console.log('UNSUBACK PACKET RECEIVED')
        console.log(packet)
        if (packet.reasonCode == null || packet.reasonCode < 128) {
          log.info(
            `Successfully unsubscribed on ${hostname} from topic: ${topic}`
          )
          decrementSubscription(hostname, topic)
        } else {
          log.warn(`Failed to unsubscribe on ${hostname} from topic: ${topic}`)
        }
        break

      case 'puback':
        if (packet.reasonCode == null || packet.reasonCode < 128) {
          log.info(`Successfully published on ${hostname} to topic: ${topic}`)
        } else {
          log.warn(`Failed to publish on ${hostname} to topic: ${topic}`)
        }
        break
    }
  })

  client.on('reconnect', () => {
    log.info(`Attempting to reconnect to ${hostname}`)
  })
  // handles transport layer errors only
  client.on('error', error => {
    log.warn(`Error - ${error.name}: ${error.message}`)
    browserWindow.webContents.send('notify', `${hostname}:${topic}:ECONNFAILED`)
    client.end()
  })

  client.on('end', () => {
    log.info(`Closed connection to ${hostname}`)
    if (hostname in connectionStore) delete connectionStore[hostname]
  })

  client.on('disconnect', packet =>
    log.warn(
      `Disconnected from ${hostname} with code ${
        packet.reasonCode ?? 'undefined'
      }`
    )
  )
}

function decrementSubscription(hostname: string, topic: NotifyTopic): void {
  const { client, subscriptions } = connectionStore[hostname]
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
