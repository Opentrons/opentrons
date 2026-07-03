import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { EncryptedCACertificates } from './types'

export function getEncryptedCACertificates(
  config: HostConfig
): ResponsePromise<EncryptedCACertificates> {
  return request<EncryptedCACertificates>(
    GET,
    '/keys/external/ca/encryptedCerts',
    config
  )
}
