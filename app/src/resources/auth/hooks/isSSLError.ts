import axios from 'axios'

import { OPENTRONS_USB } from '/app/redux/discovery/constants'

const LOCAL_TRANSPORT_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  OPENTRONS_USB,
])

// Chromium net::Error codes from net/base/net_error_list.h (Electron only).
const SSL_ERROR_CODES = [
  'ERR_PROXY_CERTIFICATE_INVALID',
  'ERR_SSL_PINNED_KEY_NOT_IN_CERT_CHAIN',
  'ERR_CERT_DATE_INVALID',
  'ERR_CERT_AUTHORITY_INVALID',
  'ERR_CERT_REVOKED',
  'ERR_CERT_INVALID',
]

function isLocalRobotHostname(hostname: string): boolean {
  return LOCAL_TRANSPORT_HOSTNAMES.has(hostname)
}

/**
 * True when login's HTTPS request failed at the transport layer because the
 * robot encryption key / cert has not been set up on this client.
 *
 * Only applies to network robots. ODD local login and USB serial-bridge
 * connections use HTTP, so a transport failure there is not a missing cert.
 */
export function isSSLError(
  error: unknown,
  hostname: string | undefined
): boolean {
  if (hostname == null || isLocalRobotHostname(hostname)) {
    return false
  }

  if (!axios.isAxiosError(error) || error.response != null) {
    return false
  }

  const code = String(error.code ?? '')
  const message = error.message ?? ''
  const combined = `${code} ${message}`

  if (SSL_ERROR_CODES.some(sslCode => combined.includes(sslCode))) {
    return true
  }

  // OAuth login requires HTTPS to remote robots; axios often collapses SSL
  // failures (e.g. ERR_SSL_PROTOCOL_ERROR) to this generic message.
  return message === 'Network Error'
}
