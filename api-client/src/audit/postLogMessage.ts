import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { PostLogMessageData, PostLogMessageResponse } from './types'

/**
 * Posts a log message to the robot audit log.
 * To be used for user actions that have no robot side effects but still need to be logged.
 * @param data.action - the name of the action to be logged. The server prepends this with 'External-'.
 * @param data.message - a longer detailed description of the specific action being taken.
 */
export function postLogMessage(
  config: HostConfig,
  data: PostLogMessageData,
  userNotes?: string
): ResponsePromise<PostLogMessageResponse> {
  return request<PostLogMessageResponse, { data: PostLogMessageData }>(
    POST,
    '/audit/external/logMessage',
    config,
    {
      body: { data },
      userNotes,
    }
  )
}
