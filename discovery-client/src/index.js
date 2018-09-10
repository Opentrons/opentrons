// @flow
// opentrons robot service discovery client
// finds robots on the network via mdns

import EventEmitter from 'events'
import mdns from 'mdns-js'
import escape from 'escape-string-regexp'
import toRegex from 'to-regex'

import { poll, stop, type PollRequest } from './poller'
import {
  DEFAULT_PORT,
  fromMdnsBrowser,
  fromResponse,
  makeCandidate,
  toCandidate,
  matchService,
  matchUnassigned,
  matchConflict,
  matchCandidate,
  rejectCandidate
} from './service'

import type { Browser, BrowserService } from 'mdns-js'
import type {
  Candidate,
  Service,
  HealthResponse,
  LogLevel,
  Logger
} from './types'

export * from './types'

type Options = {
  pollInterval?: number,
  services?: Array<Service>,
  candidates?: Array<string | Candidate>,
  nameFilter?: Array<string | RegExp>,
  ipFilter?: Array<string | RegExp>,
  portFilter?: Array<number>,
  logger?: Logger
}

const log = (logger: ?Logger, level: LogLevel, msg: string, meta?: {}) =>
  logger && typeof logger[level] === 'function' && logger[level](msg, meta)

const santizeRe = (patterns: ?Array<string | RegExp>) => {
  if (!patterns) return []
  return patterns.map(p => (typeof p === 'string' ? escape(p) : p))
}

export default function DiscoveryClientFactory (options?: Options) {
  return new DiscoveryClient(options || {})
}

export const SERVICE_EVENT: 'service' = 'service'
export const SERVICE_REMOVED_EVENT: 'serviceRemoved' = 'serviceRemoved'
export const DEFAULT_POLL_INTERVAL = 5000
export { DEFAULT_PORT }

const TO_REGEX_OPTS = { contains: true, nocase: true, safe: true }

export class DiscoveryClient extends EventEmitter {
  services: Array<Service>
  candidates: Array<Candidate>
  _browser: ?Browser
  _pollRequest: ?PollRequest
  _pollInterval: number
  _nameFilter: RegExp
  _ipFilter: RegExp
  _portFilter: Array<number>
  _logger: ?Logger

  constructor (options: Options) {
    super()

    // null out ok flag for pre-populated services
    this.services = (options.services || []).map(s => ({
      ...s,
      ok: null,
      serverOk: null
    }))

    // allow strings instead of full {ip: string, port: ?number} object
    this.candidates = (options.candidates || [])
      .map(c => (typeof c === 'string' ? makeCandidate(c) : c))
      .filter(c => this.services.every(s => s.ip !== c.ip))

    this._pollInterval = options.pollInterval || DEFAULT_POLL_INTERVAL
    this._nameFilter = toRegex(santizeRe(options.nameFilter), TO_REGEX_OPTS)
    this._ipFilter = toRegex(santizeRe(options.ipFilter), TO_REGEX_OPTS)
    this._portFilter = [DEFAULT_PORT].concat(options.portFilter || [])
    this._logger = options.logger
    this._browser = null

    log(this._logger, 'silly', 'Created', this)
  }

  start (): DiscoveryClient {
    log(this._logger, 'debug', 'starting discovery client', {})
    this._startBrowser()
    this._poll()

    return this
  }

  stop (): DiscoveryClient {
    log(this._logger, 'debug', 'stopping discovery client', {})
    this._stopBrowser()
    this._stopPoll()

    return this
  }

  add (ip: string, port?: number): DiscoveryClient {
    if (!this.candidates.some(c => c.ip === ip)) {
      const candidate = makeCandidate(ip, port)
      log(this._logger, 'debug', 'adding new unique candidate', { candidate })
      this.candidates = this.candidates.concat(candidate)
      this._poll()
    }

    return this
  }

  remove (name: string): DiscoveryClient {
    const removals = this.services.filter(s => s.name === name)

    this.services = this.services.filter(s => s.name !== name)
    this.candidates = this.candidates.filter(c =>
      removals.every(s => s.ip !== c.ip)
    )

    log(this._logger, 'debug', 'removed services from discovery', { removals })
    this._poll()
    removals.forEach(s => this.emit(SERVICE_REMOVED_EVENT, s))

    return this
  }

  setPollInterval (interval: number): DiscoveryClient {
    this._pollInterval = interval || DEFAULT_POLL_INTERVAL
    this._poll()

    return this
  }

  _poll (): void {
    log(this._logger, 'debug', '(re)starting polling', {})
    stop(this._pollRequest, this._logger)
    this._pollRequest = poll(
      this.services
        .map(toCandidate)
        .filter(Boolean)
        .concat(this.candidates),
      this._pollInterval,
      this._handleHealth.bind(this),
      this._logger
    )
  }

  _stopPoll (): void {
    stop(this._pollRequest, this._logger)
    this._pollRequest = null
  }

  _startBrowser (): void {
    this._stopBrowser()

    const browser = mdns
      .createBrowser(mdns.tcp('http'))
      .once('ready', () => browser.discover())
      .on('update', service => this._handleUp(service))
      .on('error', error => this.emit('error', error))

    this._browser = browser
  }

  _stopBrowser (): void {
    if (this._browser) {
      this._browser
        .removeAllListeners('ready')
        .removeAllListeners('update')
        .removeAllListeners('error')
        .stop()

      this._browser = null
    }
  }

  _handleUp (browserService: BrowserService): void {
    log(this._logger, 'debug', 'mdns service detected', { browserService })
    const service = fromMdnsBrowser(browserService)

    if (service) this._handleService(service)
  }

  _handleHealth (
    candidate: Candidate,
    apiResponse: ?HealthResponse,
    serverResponse: ?HealthResponse
  ): mixed {
    const service = fromResponse(candidate, apiResponse, serverResponse)

    if (service) return this._handleService(service)

    // else, response was not ok, so unset ok flag in all matching ips
    const { ip } = candidate
    const nextServices = this.services.map(
      s =>
        s.ip === ip && (s.ok !== false || s.serverOk !== false)
          ? { ...s, ok: false, serverOk: false }
          : s
    )

    this._updateServiceList(nextServices)
  }

  _handleService (service: Service): mixed {
    if (
      !this._nameFilter.test(service.name) ||
      !this._ipFilter.test(service.ip || '') ||
      !this._portFilter.includes(service.port)
    ) {
      log(this._logger, 'debug', 'Ignoring service', service)
      return
    }

    const candidateExists = this.candidates.some(matchCandidate(service))
    const serviceConflicts = this.services.filter(matchConflict(service))
    const prevService =
      this.services.find(matchService(service)) ||
      this.services.find(matchUnassigned(service))
    let nextServices = this.services

    // add service if necessary
    if (!prevService) nextServices = nextServices.concat(service)

    // update existing services and null out conflics
    nextServices = nextServices.map(s => {
      // if we have a service already, make sure not to reset oks to null
      if (s === prevService) {
        const newOk = s.ok == null ? service.ok : s.ok
        const newServerOk = s.serverOk == null ? service.serverOk : s.serverOk

        return newOk !== s.ok || newServerOk !== s.serverOk
          ? { ...service, ok: newOk, serverOk: newServerOk }
          : s
      }

      return serviceConflicts.includes(s)
        ? { ...s, ip: null, ok: null, serverOk: null }
        : s
    })

    // promote candidates and update service list
    // repoll if our IP addresses may have changed
    const pollNeeed = candidateExists || !prevService || !prevService.ip
    this.candidates = this.candidates.filter(rejectCandidate(service))
    this._updateServiceList(nextServices, pollNeeed)
  }

  // update this.services, emit if necessary, return number of services updated
  _updateServiceList (nextServices: Array<Service>, poll?: boolean): void {
    const updated = nextServices.filter((s, i) => s !== this.services[i])
    this.services = nextServices

    if (poll) this._poll()
    if (updated.length) {
      updated.forEach(s => this.emit(SERVICE_EVENT, s))
      log(this._logger, 'debug', 'updated services', { updated })
    }
  }
}
