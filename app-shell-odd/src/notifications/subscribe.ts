import { connectionStore } from './store'
import {
  sendDeserialized,
  sendDeserializedGenericError,
  sendDeserializedRefetch,
} from './deserialize'
import { notifyLog } from './notifyLog'

import type mqtt from 'mqtt'
import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'

/**
 * @property {number} qos: "Quality of Service", "at least once". Because we use React Query, which does not trigger
  a render update event if duplicate data is received, we can avoid the additional overhead of guaranteeing "exactly once" delivery.
 */
const subscribeOptions: mqtt.IClientSubscribeOptions = {
  qos: 1,
}

const CHECK_CONNECTION_INTERVAL = 500

export function subscribe(topic: NotifyTopic): Promise<void> {
  if (connectionStore.isConnectionTerminated()) {
    const errorMessage = connectionStore.getFailedConnectionStatus()
    if (errorMessage != null) {
      sendDeserialized(topic, errorMessage)
    }
    return Promise.resolve()
  } else {
    return waitUntilActiveOrErrored('client')
      .then(() => {
        const { client } = connectionStore
        if (client == null) {
          return Promise.reject(new Error('Expected hostData, received null.'))
        }
        // The first time the client wants to subscribe on a robot to a particular topic.
        else if (
          !connectionStore.isActiveSub(topic) &&
          !connectionStore.isPendingSub(topic)
        ) {
          connectionStore
            .setSubStatus(topic, 'pending')
            .then(
              () =>
                new Promise<void>(() => {
                  client.subscribe(topic, subscribeOptions, subscribeCb)
                })
            )
            .catch((error: Error) => notifyLog.debug(error.message))
        }
        // The client is either already subscribed or the subscription is currently pending.
        else {
          void waitUntilActiveOrErrored('subscription', topic)
            .then(() => sendDeserializedRefetch(topic))
            .catch((error: Error) => {
              notifyLog.debug(error.message)
              sendDeserializedGenericError(topic)
            })
        }
      })
      .catch((error: Error) => {
        notifyLog.debug(error.message)
        sendDeserializedGenericError(topic)
      })
  }

  function subscribeCb(error: Error, result: mqtt.ISubscriptionGrant[]): void {
    const { robotName, ip } = connectionStore

    if (error != null) {
      sendDeserializedGenericError(topic)
      notifyLog.debug(
        `Failed to subscribe to ${robotName} on ${ip} to topic: ${topic}`
      )
    } else {
      notifyLog.debug(
        `Successfully subscribed to ${robotName} on ${ip} to topic: ${topic}`
      )
      connectionStore
        .setSubStatus(topic, 'subscribed')
        .catch((error: Error) => notifyLog.debug(error.message))

      sendDeserializedRefetch(topic)
    }
  }
}

// Check every 500ms for 2 seconds before failing.
function waitUntilActiveOrErrored(
  connection: 'client' | 'subscription',
  topic?: NotifyTopic
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (connection === 'subscription') {
      if (topic == null) {
        reject(
          new Error(
            'Must specify a topic when connection is type "subscription".'
          )
        )
      }
    }

    const MAX_RETRIES = 4
    let counter = 0
    const intervalId = setInterval(() => {
      const hasReceivedAck =
        connection === 'client'
          ? connectionStore.isConnectedToBroker()
          : connectionStore.isActiveSub(topic as NotifyTopic)
      if (hasReceivedAck) {
        clearInterval(intervalId)
        resolve()
      }

      counter++
      if (counter === MAX_RETRIES) {
        clearInterval(intervalId)
        reject(
          new Error(
            `Maximum number of retries exceeded for ${connectionStore.robotName} on ${connectionStore.ip}.`
          )
        )
      }
    }, CHECK_CONNECTION_INTERVAL)
  })
}
