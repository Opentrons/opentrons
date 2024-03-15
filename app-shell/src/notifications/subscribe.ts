import mqtt from 'mqtt'

import { connectionStore } from './store'
import { sendToBrowserDeserialized } from './deserialize'
import { notifyLog } from './log'
import { FAILURE_STATUSES } from '../constants'

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
  hostname,
  topic,
}: {
  hostname: string
  topic: NotifyTopic
}): Promise<void> {
  if (!connectionStore.isHostReachable(hostname)) {
    const errorMessage = connectionStore.getFailedConnectionStatus(hostname)
    if (errorMessage != null) {
      sendToBrowserDeserialized({
        hostname,
        topic,
        message: errorMessage,
      })
    }

    return Promise.resolve()
  } else {
    return waitUntilActiveOrErrored('client')
      .then(() => {
        const client = connectionStore.getClient(hostname)
        if (client == null) {
          return Promise.reject(new Error('Expected hostData, received null.'))
        }

        if (
          !connectionStore.isActiveSub(hostname, topic) ||
          !connectionStore.isPendingSub(hostname, topic)
        ) {
          connectionStore.setSubStatus(hostname, topic, 'pending')
          return new Promise<void>(() => {
            client.subscribe(topic, subscribeOptions, subscribeCb)
            connectionStore.setSubStatus(hostname, topic, 'subscribed')
          })
        } else {
          void waitUntilActiveOrErrored('subscription').catch(
            (error: Error) => {
              notifyLog.debug(error.message)
              sendToBrowserDeserialized({
                hostname,
                topic,
                message: FAILURE_STATUSES.ECONNFAILED,
              })
            }
          )
        }
      })
      .catch((error: Error) => {
        notifyLog.debug(error.message)
        sendToBrowserDeserialized({
          hostname,
          topic,
          message: FAILURE_STATUSES.ECONNFAILED,
        })
      })
  }

  function subscribeCb(error: Error, result: mqtt.ISubscriptionGrant[]): void {
    if (error != null) {
      sendToBrowserDeserialized({
        hostname,
        topic,
        message: FAILURE_STATUSES.ECONNFAILED,
      })
    } else {
      notifyLog.debug(
        `Successfully subscribed on ${hostname} to topic: ${topic}`
      )
      connectionStore.setSubStatus(hostname, topic, 'subscribed')
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
            ? connectionStore.isHostConnected(hostname)
            : connectionStore.isActiveSub(hostname, topic)
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
