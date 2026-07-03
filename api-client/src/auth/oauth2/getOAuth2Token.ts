import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'

/** Our server currently expects us to supply this hard-coded client_id. */
export const OAUTH2_CLIENT_ID = 'opentrons_app' as const

/**
 * An OAuth 2  "Resource owner password credentials" request,
 * to exchange a username+password for an access token.
 *
 * https://datatracker.ietf.org/doc/html/rfc6749#section-4.3
 */
export interface ROPCRequest {
  grant_type: 'password'
  username: string
  password: string
  // RFC 6749 seems to say client_id shouldn't be necessary here for public
  // clients like the Opentrons App, but our server currently requires it anyway.
  client_id: typeof OAUTH2_CLIENT_ID
}

/**
 * A refresh request, to get a new access token before the old one expires.
 *
 * https://datatracker.ietf.org/doc/html/rfc6749#section-6
 */
export interface RefreshRequest {
  grant_type: 'refresh_token'
  refresh_token: string
  // RFC 6749 seems to say client_id shouldn't be necessary here for public
  // clients like the Opentrons App, but our server currently requires it anyway.
  client_id: typeof OAUTH2_CLIENT_ID
}

export interface OAuth2TokenResponse {
  /**
   * In practice, token_type will always be "Bearer" for us,
   * but calling code should validate it and refuse token_types
   * that it doesn't understand.
   */
  token_type: string
  access_token: string
  refresh_token?: string
  expires_in?: number /** In seconds. */
  scope?: string
}

/**
 * Obtain an OAuth 2 access token.
 *
 * https://datatracker.ietf.org/doc/html/rfc6749#section-3.2
 */
export function getOAuth2Token(
  config: HostConfig,
  body: ROPCRequest | RefreshRequest
): ResponsePromise<OAuth2TokenResponse> {
  const encodedBody = new URLSearchParams({ ...body })
  return request<OAuth2TokenResponse, URLSearchParams>(
    POST,
    '/auth/oauth2/token',
    config,
    { body: encodedBody, requiresSecureTransport: true }
  )
}
