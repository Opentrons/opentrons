import isEqual from 'lodash/isEqual'

import { connectionStore } from './store'

import type {
  NotifyBrokerResponses,
  NotifyRefetchData,
  NotifyResponseData,
  NotifyTopic,
  NotifyUnsubscribeData,
} from '@opentrons/app/src/redux/shell/types'
import { FAILURE_STATUSES } from '../constants'

const VALID_NOTIFY_RESPONSES: [NotifyRefetchData, NotifyUnsubscribeData] = [
<<<<<<< HEAD
<<<<<<< HEAD
  { refetch: true },
=======
  { refetchUsingHTTP: true },
>>>>>>> 1ba616651c (refactor(app-shell-odd): Utilize robot-server unsubscribe flags (#14724))
=======
  { refetch: true },
>>>>>>> ef8db92660 (refactor(app, robot-server): Rename refetchUsingHTTP -> refetch (#14800))
  { unsubscribe: true },
]

export function sendDeserialized(
  topic: NotifyTopic,
  message: NotifyResponseData
): void {
  try {
    const browserWindow = connectionStore.getBrowserWindow()
    browserWindow?.webContents.send(
      'notify',
      connectionStore.ip,
      topic,
      message
    )
  } catch {} // Prevents shell erroring during app shutdown event.
}

export function sendDeserializedRefetch(topic: NotifyTopic): void {
  sendDeserialized(topic, { refetch: true })
}

export function sendDeserializedGenericError(topic: NotifyTopic): void {
  sendDeserialized(topic, FAILURE_STATUSES.ECONNFAILED)
}

export function deserializeExpectedMessages(
  message: string
): Promise<NotifyBrokerResponses> {
  return new Promise((resolve, reject) => {
    let deserializedMessage: NotifyResponseData | Record<string, unknown>
    const error = new Error(
      `Unexpected data received from notify broker: ${message}`
    )

    try {
      deserializedMessage = JSON.parse(message)
    } catch {
      reject(error)
    }

    const isValidNotifyResponse = VALID_NOTIFY_RESPONSES.some(model =>
      isEqual(model, deserializedMessage)
    )
    if (!isValidNotifyResponse) {
      reject(error)
    } else {
      resolve(JSON.parse(message))
    }
  })
}
