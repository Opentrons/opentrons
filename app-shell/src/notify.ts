/* eslint-disable @typescript-eslint/no-dynamic-delete */
import mqtt from 'mqtt'

import { createLogger } from './log'

import type { BrowserWindow } from 'electron'
import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'
import type { Action, Dispatch } from './types'
// TOME:Write up purpose of what this does -- abstracts the connection/disconnection process.
// TOME: Explain that redundant requests don't harm network, but might as well prevent them (when subscribing),
// but redundant connections do disconnect old connections.

// TOME: Wire up the MR endpoint (add logic to the hook that makes use of the dispatches)
// TOME: Test that redundant emissions still get data.
// TOME: Test that fallback logic works.

const log = createLogger('notify')

interface ConnectionStore {
  [hostname: string]: {
    client: mqtt.MqttClient
    subscriptions: Partial<Record<NotifyTopic, number>> // a frequency counter. unsubscribe from topic when counter is 0.
  }
}

const connectionStore: ConnectionStore = {}

// TOME: Highlight here that we make the assumption that if we can connect
// to the broker at some point, we don't need a backup connection via HTTP. I think that's very fair.
const connectOptions: mqtt.IClientOptions = {
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
      case 'shell:NOTIFY_SUBSCRIBE':
        return subscribe({ ...action.payload, browserWindow: mainWindow })

      case 'shell:NOTIFY_UNSUBSCRIBE':
        return unsubscribe({ ...action.payload })
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
    const client = mqtt.connect(`mqtt://${hostname}`, connectOptions)
    establishListeners({ ...notifyParams, client })
    client.subscribe(topic, subscribeOptions)
  } else {
    const { client } = connectionStore[hostname]
    client.subscribe(topic, subscribeOptions)
  }
}

type UnsubscribeParams = Omit<NotifyParams, 'browserWindow'>

function unsubscribe({ hostname, topic }: UnsubscribeParams): void {
  if (hostname in connectionStore) {
    const { client } = connectionStore[hostname]
    client.unsubscribe(topic)
  } else {
    log.info(`Attempting to unsubscribe from unconnected hostname ${hostname}`)
  }
}

export function closeAllNotifyConnections(): Promise<unknown[]> {
  const closePromises = Object.values(connectionStore).map(({ client }) => {
    return new Promise(() => {
      client.end()
    })
  })
  return Promise.all(closePromises)
}

interface ListenerParams extends NotifyParams {
  client: mqtt.MqttClient
}

// See https://docs.emqx.com/en/cloud/latest/connect_to_deployments/mqtt_client_error_codes.html
// Packets with reason codes < 128 are successful operations.
function establishListeners({
  client,
  browserWindow,
  hostname,
  topic,
}: ListenerParams): void {
  client.on('message', (topic, message, packet) => {
    // TOME: Make sure data is sent properly as a string when testing. Let the app do all the serialization stuff.
    browserWindow.webContents.send(
      'notify',
      `${hostname}:${topic}:${message.toString()}`
    )
    log.debug(`Received message: ${hostname}:${topic}:${message.toString()}`)
  })

  client.on('connect', connack => {
    if (connack.reasonCode == null || connack.reasonCode < 128) {
      log.info(`Successfully connected to ${hostname}`)
      connectionStore[hostname] = {
        client,
        subscriptions: {},
      }
      client.subscribe(topic, subscribeOptions)
    } else {
      log.warn(`Failed to connect to ${hostname}`)
      browserWindow.webContents.send(
        'notify',
        `${hostname}:${topic}:ECONNFAILED`
      )
    }
  })
  // TOME: I'd really think about this error code null logic here. Is that actually good?
  // What is the normal reason code given. THAT is a better indication of what to do.
  // TOME: Also console.log out the connectionStore object. Are subscriptions & connectionStore added/removed correctly?
  client.on('packetreceive', packet => {
    switch (packet.cmd) {
      case 'suback':
        console.log('SUBACK PACKET RECEIVED')
        console.log(packet)
        if (packet.reasonCode == null || packet.reasonCode < 128) {
          log.info(`Successfully subscribed on ${hostname} to topic: ${topic}`)
          connectionStore[hostname].subscriptions[topic] =
            (connectionStore[hostname].subscriptions[topic] ?? 0) + 1
        } else {
          log.warn(`Failed to subscribe on ${hostname} to topic: ${topic}`)
          browserWindow.webContents.send(
            'notify',
            `${hostname}:${topic}:ECONNFAILED`
          )
        }
        break

      case 'unsuback':
        console.log('UNSUBACK PACKET RECEIVED')
        console.log(packet)
        if (packet.reasonCode == null || packet.reasonCode < 128) {
          log.info(
            `Successfully unsubscribed on ${hostname} from topic: ${topic}`
          )
          const { client, subscriptions } = connectionStore[hostname]
          delete subscriptions[topic]

          console.log('UPDATED CONNECTION STORE')
          console.log(connectionStore)

          if (Object.keys(subscriptions).length <= 0) {
            client.end()
          }
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
    log.info(`Reconnected to ${hostname}`)
  })
  // handles transport layer errors only
  client.on('error', error => {
    log.warn(`Error - ${error.name}: ${error.message}`)
  })

  client.on('end', () => {
    log.info(`Closed connection to ${hostname}`)
    delete connectionStore[hostname]
  })

  client.on('disconnect', packet =>
    log.warn(
      `Disconnected from ${hostname} with code ${
        packet.reasonCode ?? 'undefined'
      }`
    )
  )
}
