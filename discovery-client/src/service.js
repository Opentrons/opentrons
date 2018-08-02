// @flow
// create Services from different sources
import net from 'net'
import type {BrowserService} from 'bonjour'

import type {Service, Candidate, HealthResponse} from './types'

export const DEFAULT_PORT = 31950

export function makeService (
  name: string,
  ip: ?string,
  port: ?number,
  ok: ?boolean
): Service {
  return {name, ip, port, ok}
}

export function fromMdnsBrowser (browserService: BrowserService): Service {
  const addresses = browserService.addresses
  let ip = addresses.find(address => net.isIPv4(address))
  if (!ip) ip = addresses.find(address => net.isIP(address))
  if (!ip) ip = browserService.host
  if (net.isIPv6(ip)) ip = `[${ip}]`

  return makeService(browserService.name, ip, browserService.port, null)
}

export function fromResponse (
  candidate: Candidate,
  response: ?HealthResponse
): ?Service {
  if (!response) return null

  return makeService(response.name, candidate.ip, candidate.port, true)
}

export function toCandidate (service: Service): ?Candidate {
  if (!service.ip) return null

  return {ip: service.ip, port: service.port}
}

export const matchService = (source: Service) => (target: Service) =>
  source.name === target.name && source.ip === target.ip

export const matchUnassigned = (source: Service) => (target: Service) =>
  source.name === target.name && target.ip === null

export const matchConflict = (source: Service) => (target: Service) =>
  source.ok && source.name !== target.name && source.ip === target.ip

export const matchCandidate = (source: Service) => (target: Candidate) =>
  source.ok && source.ip === target.ip

export const rejectCandidate = (source: Service) => (target: Candidate) =>
  !source.ok || source.ip !== target.ip
