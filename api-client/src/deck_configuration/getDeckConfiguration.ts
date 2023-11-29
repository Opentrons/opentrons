import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { DeckConfigurationResponse } from './types'

export function getDeckConfiguration(
  config: HostConfig
): ResponsePromise<DeckConfigurationResponse> {
  return request<DeckConfigurationResponse>(
    GET,
    `/deck_configuration`,
    null,
    config
  )
}
