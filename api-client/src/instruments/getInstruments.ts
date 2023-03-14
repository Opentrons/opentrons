import { GET, appShellRequest } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function getInstruments(config: HostConfig): ResponsePromise<unknown> {
  return appShellRequest<unknown>(GET, `/instruments`, null, config)
}
