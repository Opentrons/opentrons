import type { NotifyTopic } from '@opentrons/app/lib/redux/shell/types'
import { connectionStore } from './store'

export function unsubscribe(
  hostname: string,
  topic: NotifyTopic
): Promise<void> {
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
