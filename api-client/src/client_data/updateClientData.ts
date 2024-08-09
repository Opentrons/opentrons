import { PUT, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type {
  ClientDataResponse,
  ClientDataRequest,
  DefaultClientData,
} from './types'

export function updateClientData<T = DefaultClientData>(
  config: HostConfig,
  key: string,
  clientData: T
): ResponsePromise<ClientDataResponse<T>> {
  return request<ClientDataResponse<T>, ClientDataRequest<T>>(
    PUT,
    `/clientData/${key}`,
    { data: clientData },
    config
  )
}
