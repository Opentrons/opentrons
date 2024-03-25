import { connectionStore } from './store'
import { notifyLog } from './notifyLog'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'

export function unsubscribe(ip: string, topic: NotifyTopic): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!connectionStore.isPendingUnsub(ip, topic)) {
      connectionStore
        .setUnsubStatus(ip, topic, 'pending')
        .then(() => {
          const client = connectionStore.getClient(ip)
          if (client == null) {
            return reject(new Error('Expected hostData, received null.'))
          }

          client.unsubscribe(topic, {}, (error, result) => {
            const robotName = connectionStore.getRobotNameByIP(ip)
            if (error != null) {
              notifyLog.debug(
                `Failed to unsubscribe to ${robotName} on ${ip} from topic: ${topic}`
              )
            } else {
              notifyLog.debug(
                `Successfully unsubscribed to ${robotName} on ${ip} from topic: ${topic}`
              )
              connectionStore
                .setUnsubStatus(ip, topic, 'unsubscribed')
                .catch((error: Error) => notifyLog.debug(error.message))
            }
          })
        })
        .catch((error: Error) => notifyLog.debug(error.message))
    }
  })
}
