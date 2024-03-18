import { connectionStore } from './store'
import { notifyLog } from './notifyLog'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'

export function unsubscribe(ip: string, topic: NotifyTopic): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!connectionStore.isPendingUnsub(ip, topic)) {
      connectionStore.setUnubStatus(ip, topic, 'pending')

      const client = connectionStore.getClient(ip)
      if (client == null) {
        return reject(new Error('Expected hostData, received null.'))
      }

      client.unsubscribe(topic, {}, (error, result) => {
        if (error != null) {
          notifyLog.debug(`Failed to unsubscribe on ${ip} from topic: ${topic}`)
        } else {
          notifyLog.debug(
            `Successfully unsubscribed on ${ip} from topic: ${topic}`
          )
          connectionStore.setUnubStatus(ip, topic, 'unsubscribed')
        }
      })
    }
  })
}
