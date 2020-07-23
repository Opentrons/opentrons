// @flow
// create Services from different sources
import net from 'net'
import defaultTo from 'lodash/defaultTo'
import isEqual from 'lodash/isEqual'

import type { BrowserService, ServiceType } from 'mdns-js'
import type {
  Service,
  ServiceUpdate,
  Candidate,
  HealthResponse,
  ServerHealthResponse,
} from './types'

const nameExtractor = (st: ServiceType) =>
  new RegExp(`^(.+)\\._${st.name}\\._${st.protocol}`)

const isLocal = (ip: ?string) => {
  if (ip == null) return null
  return (
    ip.startsWith('169.254') ||
    ip.startsWith('[fe80') ||
    ip.startsWith('[fd00') ||
    ip === 'localhost'
  )
}
export const DEFAULT_PORT = 31950

export function makeService(
  name: string,
  ip: ?string,
  port: ?number,
  ok: ?boolean,
  serverOk: ?boolean,
  advertising: ?boolean,
  health: ?HealthResponse,
  serverHealth: ?ServerHealthResponse
): Service {
  return {
    name,
    ip: defaultTo(ip, null),
    port: defaultTo(port, DEFAULT_PORT),
    local: isLocal(ip),
    ok: defaultTo(ok, null),
    serverOk: defaultTo(serverOk, null),
    advertising: defaultTo(advertising, null),
    health: health || null,
    serverHealth: serverHealth || null,
  }
}

// apply known value updates (not null or undefined) to a service, returning
// original service reference if nothing to update
export function updateService(
  service: Service,
  update: ServiceUpdate
): Service {
  const next: Service | ServiceUpdate = update

  return Object.keys(update).reduce<Service>((result: Service, key: string) => {
    const prevVal = result[key]
    const nextVal = defaultTo(next[key], prevVal)
    // use isEqual to deep compare response objects
    return isEqual(nextVal, prevVal) ? result : { ...result, [key]: nextVal }
  }, service)
}

// null out conflicting fields
export function clearServiceIfConflict(
  service: Service,
  update: ?ServiceUpdate
): Service {
  return update && service.ip === update.ip
    ? { ...service, ip: null, local: null, ok: null, serverOk: null }
    : service
}

export function makeCandidate(ip: string, port: ?number): Candidate {
  return { ip, port: port || DEFAULT_PORT }
}

export function fromMdnsBrowser(browserService: BrowserService): ?Service {
  const { addresses, type, port, fullname } = browserService

  if (!type || !fullname) return null

  let ip = addresses.find(address => net.isIPv4(address))
  if (!ip) ip = addresses.find(address => net.isIP(address))
  if (!ip) return null

  if (net.isIPv6(ip)) ip = `[${ip}]`

  const nameMatch = type[0] && fullname.match(nameExtractor(type[0]))
  const name = (nameMatch && nameMatch[1]) || fullname

  return makeService(name, ip, port, null, null, true)
}

export function fromResponse(
  candidate: Candidate,
  healthResponse: ?HealthResponse,
  serverHealthResponse: ?ServerHealthResponse
): ?Service {
  const apiName = healthResponse && healthResponse.name
  const serverName = serverHealthResponse && serverHealthResponse.name
  const name = defaultTo(serverName, apiName)
  let apiOk = !!healthResponse

  if (!name) return null

  // in case of name mismatch, prefer /server/update/health name and flag not ok
  if (apiName != null && serverName != null && apiName !== serverName) {
    apiOk = false
  }

  return makeService(
    name,
    candidate.ip,
    candidate.port,
    apiOk,
    !!serverHealthResponse,
    null,
    healthResponse,
    serverHealthResponse
  )
}

export function toCandidate(service: Service): ?Candidate {
  if (!service.ip) return null

  return makeCandidate(service.ip, service.port)
}

export const matchService: Service => Service => boolean = source => target =>
  source.name === target.name && source.ip === target.ip
