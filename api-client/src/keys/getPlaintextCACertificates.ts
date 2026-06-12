import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { PlaintextCACertificates } from './types'

export function getPlaintextCACertificates(
  config: HostConfig
): ResponsePromise<PlaintextCACertificates> {
  return request<PlaintextCACertificates>(
    GET,
    '/keys/external/ca/plaintextCerts',
    {
      ...config,
      secure: true,
    }
  )
}
