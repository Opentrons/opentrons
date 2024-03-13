import { connectionStore } from './store'
import { notifyLog } from './log'

import type { NotifyTopic } from '@opentrons/app/lib/redux/shell/types'

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
            notifyLog.debug(
              `Failed to unsubscribe on ${hostname} from topic: ${topic}`
            )
          } else {
            notifyLog.debug(
              `Successfully unsubscribed on ${hostname} from topic: ${topic}`
            )
            const { subscriptions } = connectionStore[hostname]
            subscriptions.delete(topic)
            pendingUnsubs.delete(topic)
          }
        })
      } else {
        notifyLog.debug(
          `Host ${hostname} to unsubscribe from unsubscribed topic: ${topic}`
        )
      }
    }
  })
}
