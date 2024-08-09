import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { ClientDataResponse, DefaultClientData } from './types'

export function getClientData<T = DefaultClientData>(
  config: HostConfig,
  key: string
): ResponsePromise<ClientDataResponse<T>> {
  return request<ClientDataResponse<T>>(GET, `/clientData/${key}`, null, config)
}
