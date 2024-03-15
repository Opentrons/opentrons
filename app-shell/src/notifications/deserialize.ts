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

interface SendToBrowserParams {
  hostname: string
  topic: NotifyTopic
  message: NotifyResponseData
}

const VALID_NOTIFY_RESPONSES: [NotifyRefetchData, NotifyUnsubscribeData] = [
  { refetchUsingHTTP: true },
  { unsubscribe: true },
]

export function sendDeserialized({
  hostname,
  topic,
  message,
}: SendToBrowserParams): void {
  try {
    const browserWindow = connectionStore.getBrowserWindow()
    browserWindow?.webContents.send('notify', hostname, topic, message)
  } catch {} // Prevents shell erroring during app shutdown event.
}

export function sendDeserializedGenericError({
  hostname,
  topic,
}: Omit<SendToBrowserParams, 'message'>): void {
  try {
    const browserWindow = connectionStore.getBrowserWindow()
    browserWindow?.webContents.send(
      'notify',
      hostname,
      topic,
      FAILURE_STATUSES.ECONNFAILED
    )
  } catch {} // Prevents shell erroring during app shutdown event.
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
