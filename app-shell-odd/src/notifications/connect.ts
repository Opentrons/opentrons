import mqtt from 'mqtt'

import { connectionStore } from './store'
import {
  sendDeserialized,
  sendDeserializedGenericError,
  deserializeExpectedMessages,
} from './deserialize'
import { unsubscribe } from './unsubscribe'
import { notifyLog } from './notifyLog'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'

// MQTT is somewhat particular about the clientId format and will connect erratically if an unexpected string is supplied.
const CLIENT_ID = 'odd-' + Math.random().toString(16).slice(2, 8) // Derived from mqttjs
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

export function connectAsync(brokerURL: string): Promise<mqtt.Client> {
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

export function establishListeners(): void {
  const client = connectionStore.client as mqtt.MqttClient
  const { ip, robotName } = connectionStore

  client.on(
    'message',
    (topic: NotifyTopic, message: Buffer, packet: mqtt.IPublishPacket) => {
      deserializeExpectedMessages(message.toString())
        .then(deserializedMessage => {
          const messageContainsUnsubFlag = 'unsubscribe' in deserializedMessage
          if (messageContainsUnsubFlag) {
            void unsubscribe(topic).catch((error: Error) =>
              notifyLog.debug(error.message)
            )
          }

          notifyLog.debug('Received notification data from main via IPC', {
            ip,
            topic,
          })

          sendDeserialized(topic, deserializedMessage)
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
    sendDeserializedGenericError('ALL_TOPICS')
    client.end()
  })

  client.on('end', () => {
    notifyLog.debug(`Closed connection to ${robotName} on ${ip}`)
    // Marking the connection as failed with a generic error status lets the connection re-establish in the future
    // and tells the browser to fall back to polling (assuming this 'end' event isn't caused by the app closing).
    void connectionStore.setErrorStatus()
  })

  client.on('disconnect', packet => {
    notifyLog.warn(
      `Disconnected from ${robotName} on ${ip} with code ${
        packet.reasonCode ?? 'undefined'
      }`
    )
    sendDeserializedGenericError('ALL_TOPICS')
  })
}

export function closeConnectionForcefully(): Promise<void> {
  const { client } = connectionStore
  return new Promise<void>((resolve, reject) =>
    client?.end(true, {}, () => resolve())
  )
}
