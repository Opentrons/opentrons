import { OPENTRONS_USB } from '../constants'

export const DEFAULT_HTTP_PORT = 31950
export const DEFAULT_HTTPS_PORT = 32313

export interface RobotHttpHost {
  ip: string
  port?: number | null
}

/**
 * Build a robot HTTP(S) URL using the same rules as api-client/request.ts.
 */
export function buildRobotHttpUrl(
  robot: RobotHttpHost,
  urlPath: string,
  options: {
    token?: string | null
    secure?: boolean
    forceHttp?: boolean
  } = {}
): string {
  const { token, secure, forceHttp } = options
  const isLocalTransport =
    robot.ip === 'localhost' ||
    robot.ip === '127.0.0.1' ||
    robot.ip === '::1' ||
    robot.ip === OPENTRONS_USB

  const requiresSecureTransport = Boolean(token) || Boolean(secure)
  // USB is an HTTP-only serial tunnel and loopback is ODD. Neither can
  // speak TLS, even when a token or secure flag is set. Matches api-client request().
  const protocol =
    forceHttp === true || isLocalTransport
      ? 'http'
      : (secure ?? false) || requiresSecureTransport
        ? 'https'
        : 'http'

  const defaultPort =
    protocol === 'https' ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT
  const configuredPort = robot.port ?? null
  const portToUse =
    configuredPort != null
      ? configuredPort === DEFAULT_HTTP_PORT && protocol === 'https'
        ? DEFAULT_HTTPS_PORT
        : configuredPort
      : defaultPort

  const normalizedPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`

  return `${protocol}://${robot.ip}:${portToUse}${normalizedPath}`
}
