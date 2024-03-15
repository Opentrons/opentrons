import { connectionStore } from './store'
import { notifyLog } from './notifyLog'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'

export function unsubscribe(
  hostname: string,
  topic: NotifyTopic
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!connectionStore.isPendingUnsub(hostname, topic)) {
      connectionStore.setUnubStatus(hostname, topic, 'pending')

      const client = connectionStore.getClient(hostname)
      if (client == null) {
        return reject(new Error('Expected hostData, received null.'))
      }

      client.unsubscribe(topic, {}, (error, result) => {
        if (error != null) {
          notifyLog.debug(
            `Failed to unsubscribe on ${hostname} from topic: ${topic}`
          )
        } else {
          notifyLog.debug(
            `Successfully unsubscribed on ${hostname} from topic: ${topic}`
          )
          connectionStore.setUnubStatus(hostname, topic, 'unsubscribed')
        }
      })
    }
  })
}
