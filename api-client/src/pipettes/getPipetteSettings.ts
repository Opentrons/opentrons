import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { PipetteSettings } from './types'

export function getPipetteSettings(
  config: HostConfig
): ResponsePromise<PipetteSettings> {
  return request<PipetteSettings>(GET, `/settings/pipettes`, null, config)
}
