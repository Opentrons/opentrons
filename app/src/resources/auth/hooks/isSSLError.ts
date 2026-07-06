import axios from 'axios'

const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])

// Chromium net::Error codes from net/base/net_error_list.h (Electron only).
const SSL_ERROR_CODES = [
  'ERR_STRICT_ECH_REQUIRED',
  'ERR_SSL_PROTOCOL_ERROR',
  'ERR_SSL_CLIENT_AUTH_CERT_NEEDED',
  'ERR_SSL_VERSION_OR_CIPHER_MISMATCH',
  'ERR_SSL_RENEGOTIATION_REQUESTED',
  'ERR_BAD_SSL_CLIENT_AUTH_CERT',
  'ERR_SSL_NO_RENEGOTIATION',
  'ERR_SSL_DECOMPRESSION_FAILURE_ALERT',
  'ERR_SSL_BAD_RECORD_MAC_ALERT',
  'ERR_SSL_CLIENT_AUTH_PRIVATE_KEY_ACCESS_DENIED',
  'ERR_SSL_CLIENT_AUTH_CERT_NO_PRIVATE_KEY',
  'ERR_PROXY_CERTIFICATE_INVALID',
  'ERR_SSL_CLIENT_AUTH_SIGNATURE_FAILED',
  'ERR_SSL_PINNED_KEY_NOT_IN_CERT_CHAIN',
  'ERR_CLIENT_AUTH_CERT_TYPE_UNSUPPORTED',
  'ERR_SSL_DECRYPT_ERROR_ALERT',
  'ERR_SSL_SERVER_CERT_CHANGED',
  'ERR_SSL_UNRECOGNIZED_NAME_ALERT',
  'ERR_SSL_CLIENT_AUTH_CERT_BAD_FORMAT',
  'ERR_SSL_SERVER_CERT_BAD_FORMAT',
  'ERR_SSL_OBSOLETE_CIPHER',
  'ERR_SSL_CLIENT_AUTH_NO_COMMON_ALGORITHMS',
  'ERR_EARLY_DATA_REJECTED',
  'ERR_WRONG_VERSION_ON_EARLY_DATA',
  'ERR_TLS13_DOWNGRADE_DETECTED',
  'ERR_SSL_KEY_USAGE_INCOMPATIBLE',
  'ERR_INVALID_ECH_CONFIG_LIST',
  'ERR_ECH_NOT_NEGOTIATED',
  'ERR_ECH_FALLBACK_CERTIFICATE_INVALID',
  'ERR_CT_STH_PARSING_FAILED',
  'ERR_CT_STH_INCOMPLETE',
  'ERR_CT_CONSISTENCY_PROOF_PARSING_FAILED',
  'ERR_CERT_COMMON_NAME_INVALID',
  'ERR_CERT_DATE_INVALID',
  'ERR_CERT_AUTHORITY_INVALID',
  'ERR_CERT_CONTAINS_ERRORS',
  'ERR_CERT_NO_REVOCATION_MECHANISM',
  'ERR_CERT_UNABLE_TO_CHECK_REVOCATION',
  'ERR_CERT_REVOKED',
  'ERR_CERT_INVALID',
  'ERR_CERT_WEAK_SIGNATURE_ALGORITHM',
  'ERR_CERT_NON_UNIQUE_NAME',
  'ERR_CERT_WEAK_KEY',
  'ERR_CERT_NAME_CONSTRAINT_VIOLATION',
  'ERR_CERT_VALIDITY_TOO_LONG',
  'ERR_CERTIFICATE_TRANSPARENCY_REQUIRED',
  'ERR_CERT_KNOWN_INTERCEPTION_BLOCKED',
  'ERR_CERT_SELF_SIGNED_LOCAL_NETWORK',
  'ERR_INSECURE_RESPONSE',
  'ERR_NO_PRIVATE_KEY_FOR_CERT',
  'ERR_QUIC_HANDSHAKE_FAILED',
  'ERR_QUIC_CERT_ROOT_NOT_KNOWN',
]

function isLocalRobotHostname(hostname: string): boolean {
  return LOCALHOST_HOSTNAMES.has(hostname)
}

/**
 * True when login's HTTPS request failed at the transport layer because the
 * robot encryption key / cert has not been set up on this client.
 *
 * Only applies to non-localhost robots; ODD local login uses HTTP.
 */
export function isSSLError(
  error: unknown,
  hostname: string | undefined
): boolean {
  console.log('isSSLError', error, hostname)
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
