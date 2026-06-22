import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { PostWifiKeysResponse, WifiKey } from './types'

export function postWifiKeys(
  config: HostConfig,
  keyFile: File
): ResponsePromise<WifiKey> {
  const formData = new FormData()
  formData.append('key', keyFile, keyFile.name)

  return request<PostWifiKeysResponse, FormData>(POST, '/wifi/keys', config, {
    body: formData,
  })
}
