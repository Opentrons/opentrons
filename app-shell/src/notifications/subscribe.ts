import mqtt from 'mqtt'

import { connectionStore } from './store'
import { sendDeserialized, sendDeserializedGenericError } from './deserialize'
import { notifyLog } from './notifyLog'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'

/**
 * @property {number} qos: "Quality of Service", "at least once". Because we use React Query, which does not trigger
  a render update event if duplicate data is received, we can avoid the additional overhead of guaranteeing "exactly once" delivery.
 */
const subscribeOptions: mqtt.IClientSubscribeOptions = {
  qos: 1,
}

const CHECK_CONNECTION_INTERVAL = 500

export function subscribe(ip: string, topic: NotifyTopic): Promise<void> {
  const robotName = connectionStore.getRobotNameFromIP(ip)

  if (connectionStore.isBrokerErrored(ip)) {
    const errorMessage = connectionStore.getFailedConnectionStatus(ip)
    if (errorMessage != null) {
      sendDeserialized({
        ip,
        topic,
        message: errorMessage,
      })
    }
    return Promise.resolve()
  } else {
    return waitUntilActiveOrErrored('client')
      .then(() => {
        const client = connectionStore.getClient(ip)
        if (client == null) {
          return Promise.reject(new Error('Expected hostData, received null.'))
        }

        if (
          !connectionStore.isActiveSub(ip, topic) &&
          !connectionStore.isPendingSub(ip, topic)
        ) {
          connectionStore
            .setSubStatus(ip, topic, 'pending')
            .then(
              () =>
                new Promise<void>(() => {
                  client.subscribe(topic, subscribeOptions, subscribeCb)
                })
            )
            .catch((error: Error) => notifyLog.debug(error.message))
        } else {
          void waitUntilActiveOrErrored('subscription').catch(
            (error: Error) => {
              notifyLog.debug(error.message)
              sendDeserializedGenericError(ip, topic)
            }
          )
        }
      })
      .catch((error: Error) => {
        notifyLog.debug(error.message)
        sendDeserializedGenericError(ip, topic)
      })
  }

  function subscribeCb(error: Error, result: mqtt.ISubscriptionGrant[]): void {
    if (error != null) {
      sendDeserializedGenericError(ip, topic)
      notifyLog.debug(
        `Failed to subscribe to ${robotName} on ${ip} to topic: ${topic}`
      )
    } else {
      notifyLog.debug(
        `Successfully subscribed to ${robotName} on ${ip} to topic: ${topic}`
      )
      connectionStore
        .setSubStatus(ip, topic, 'subscribed')
        .catch((error: Error) => notifyLog.debug(error.message))
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
        const hasReceivedAck =
          connection === 'client'
            ? connectionStore.isConnectedToBroker(ip)
            : connectionStore.isActiveSub(ip, topic)
        if (hasReceivedAck) {
          clearInterval(intervalId)
          resolve()
        }

        counter++
        if (counter === MAX_RETRIES) {
          clearInterval(intervalId)
          reject(
            new Error(
              `Maximum number of retries exceeded for ${robotName} on ${ip}.`
            )
          )
        }
      }, CHECK_CONNECTION_INTERVAL)
    })
  }
}
