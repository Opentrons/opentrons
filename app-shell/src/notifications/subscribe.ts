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

export function subscribe({
  ip,
  topic,
}: {
  ip: string
  topic: NotifyTopic
}): Promise<void> {
  if (!connectionStore.isBrokerReachable(ip)) {
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
          connectionStore.setSubStatus(ip, topic, 'pending')
          return new Promise<void>(() => {
            client.subscribe(topic, subscribeOptions, subscribeCb)
          })
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
    } else {
      notifyLog.debug(`Successfully subscribed on ${ip} to topic: ${topic}`)
      connectionStore.setSubStatus(ip, topic, 'subscribed')
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
          reject(new Error('Maximum number of retries exceeded.'))
        }
      }, CHECK_CONNECTION_INTERVAL)
    })
  }
}
