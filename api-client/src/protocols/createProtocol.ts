import { POST, request } from '../request'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Protocol } from './types'

export function createProtocol(
  config: HostConfig,
  files: File[]
): ResponsePromise<Protocol> {
  const formData = new FormData()
  // NOTE(bc, 2021-11-03): We're only expecting one file for now, because currently the
  // api can only handle one under the "files" key, replace this with multi file capabilities
  // during custom labware support pass
  formData.append('files', files[0], files[0].name)

  return request<Protocol, FormData>(POST, '/protocols', formData, config)
}
