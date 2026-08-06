import { DELETE, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { EmptyResponse, HostConfig } from '../../types'

export function deleteUser(
  config: HostConfig,
  username: string,
  userNotes?: string
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse>(
    DELETE,
    `/auth/users/byUsername/${encodeURIComponent(username)}`,
    config,
    { userNotes }
  )
}
