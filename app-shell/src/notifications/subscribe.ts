import type {
  NotifyBrokerResponses,
  NotifyNetworkError,
  NotifyTopic,
} from '@opentrons/app/lib/redux/shell/types'
import { FAILURE_STATUSES } from '../constants'
import mqtt from 'mqtt'
import { connectionStore } from '../notify'

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
  if (unreachableHosts.has(hostname)) {
    const errorMessage = determineErrorMessageFor(hostname)
    sendToBrowserDeserialized({
      hostname,
      topic,
      message: errorMessage,
    })

    return Promise.resolve()
  } else {
    return waitUntilActiveOrErrored('client')
      .then(() => {
        // Break this guy out into a function IMO.
        const { client, subscriptions, pendingSubs } = connectionStore[hostname]
        if (!subscriptions.has(topic)) {
          if (!pendingSubs.has(topic)) {
            pendingSubs.add(topic)
            return new Promise<void>(() => {
              client?.subscribe(topic, subscribeOptions, subscribeCb)
              pendingSubs.delete(topic)
            })
          } else {
            void waitUntilActiveOrErrored('subscription').catch(
              (error: Error) => {
                log.debug(error.message)
                sendToBrowserDeserialized({
                  hostname,
                  topic,
                  message: FAILURE_STATUSES.ECONNFAILED,
                })
              }
            )
          }
        }
      })
      .catch((error: Error) => {
        log.debug(error.message)
        sendToBrowserDeserialized({
          hostname,
          topic,
          message: FAILURE_STATUSES.ECONNFAILED,
        })
      })
  }
}

// Only send one ECONNREFUSED per robot per app session.
function determineErrorMessageFor(hostname: string): NotifyNetworkError {
  let message: NotifyNetworkError
  if (!robotsWithReportedPortBlockEvent.has(hostname)) {
    message = FAILURE_STATUSES.ECONNREFUSED
    robotsWithReportedPortBlockEvent.add(hostname)
  } else {
    message = FAILURE_STATUSES.ECONNFAILED
  }
  return message
}

function subscribeCb(error: Error, result: mqtt.ISubscriptionGrant[]): void {
  const { subscriptions } = connectionStore[hostname]
  if (error != null) {
    sendToBrowserDeserialized({
      hostname,
      topic,
      message: FAILURE_STATUSES.ECONNFAILED,
    })
  } else {
    log.debug(`Successfully subscribed on ${hostname} to topic: ${topic}`)
    subscriptions.add(topic)
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
      const host = connectionStore[hostname]
      const hasReceivedAck =
        connection === 'client'
          ? host.client != null
          : host.subscriptions.has(topic)
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

function checkForUnsubscribeFlag(
  deserializedMessage: NotifyBrokerResponses,
  hostname: string,
  topic: NotifyTopic
): void {
  const messageContainsUnsubFlag = 'unsubscribe' in deserializedMessage
  if (messageContainsUnsubFlag) {
    void unsubscribe(hostname, topic)
  }
}

function unsubscribe(hostname: string, topic: NotifyTopic): Promise<void> {
  return new Promise<void>(() => {
    if (!pendingUnsubs.has(topic)) {
      if (connectionStore[hostname].subscriptions.has(topic)) {
        pendingUnsubs.add(topic)
        const { client } = connectionStore[hostname]
        client?.unsubscribe(topic, {}, (error, result) => {
          if (error != null) {
            log.debug(
              `Failed to unsubscribe on ${hostname} from topic: ${topic}`
            )
          } else {
            log.debug(
              `Successfully unsubscribed on ${hostname} from topic: ${topic}`
            )
            const { subscriptions } = connectionStore[hostname]
            subscriptions.delete(topic)
            pendingUnsubs.delete(topic)
          }
        })
      } else {
        log.debug(
          `Host ${hostname} to unsubscribe from unsubscribed topic: ${topic}`
        )
      }
    }
  })
}
