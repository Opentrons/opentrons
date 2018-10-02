// @flow
// create Services from different sources
import net from 'net'
import type {BrowserService, ServiceType} from 'mdns-js'

import type {Service, ServiceUpdate, Candidate, HealthResponse} from './types'

const nameExtractor = (st: ServiceType) =>
  new RegExp(`^(.+)\\._${st.name}\\._${st.protocol}`)

const getOrElse = (value, orElse) => (value != null ? value : orElse)

export const DEFAULT_PORT = 31950

export function makeService (
  name: string,
  ip: ?string,
  port: ?number,
  ok: ?boolean,
  serverOk: ?boolean
): Service {
  return {
    name,
    ip: ip || null,
    port: port || DEFAULT_PORT,
    ok: ok != null ? ok : null,
    serverOk: serverOk != null ? serverOk : null,
  }
}

// apply known value updates (not null or undefined) to a service, returning
// original service reference if nothing to update
export function updateService (
  service: Service,
  update: ServiceUpdate
): Service {
  const next: Service | ServiceUpdate = update

  return Object.keys(update).reduce((result, key) => {
    const prevVal = result[key]
    const nextVal = getOrElse(next[key], prevVal)
    // $FlowFixMe: flow can't type [key]: nextVal but we know this is correct
    return nextVal !== prevVal ? {...result, [key]: nextVal} : result
  }, service)
}

// null out conflicting fields
export function clearServiceIfConflict (
  service: Service,
  update: ?Service
): Service {
  return update && service.ip === update.ip
    ? {...service, ip: null, ok: null, serverOk: null}
    : service
}

export function makeCandidate (ip: string, port: ?number): Candidate {
  return {ip, port: port || DEFAULT_PORT}
}

export function fromMdnsBrowser (browserService: BrowserService): ?Service {
  const {addresses, type, port, fullname} = browserService

  if (!type || !fullname) return null

  let ip = addresses.find(address => net.isIPv4(address))
  if (!ip) ip = addresses.find(address => net.isIP(address))
  if (!ip) return null

  if (net.isIPv6(ip)) ip = `[${ip}]`

  const nameMatch = type[0] && fullname.match(nameExtractor(type[0]))
  const name = (nameMatch && nameMatch[1]) || fullname

  return makeService(name, ip, port)
}

export function fromResponse (
  candidate: Candidate,
  response: ?HealthResponse,
  serverResponse: ?HealthResponse
): ?Service {
  const apiName = response && response.name
  const serverName = serverResponse && serverResponse.name
  let apiOk = apiName != null
  let name = apiName || serverName

  if (!name) return null

  // in case of name mismatch, prefer /server/health name and flag not ok
  if (apiName != null && serverName != null && apiName !== serverName) {
    name = serverName
    apiOk = false
  }

  return makeService(
    name,
    candidate.ip,
    candidate.port,
    apiOk,
    serverName != null
  )
}

export function toCandidate (service: Service): ?Candidate {
  if (!service.ip) return null

  return makeCandidate(service.ip, service.port)
}

export const matchService = (source: Service) => (target: Service) =>
  source.name === target.name && source.ip === target.ip
