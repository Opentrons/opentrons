// @flow
// opentrons robot service discovery client
// finds robots on the network via mdns

import EventEmitter from 'events'
import escape from 'escape-string-regexp'
import toRegex from 'to-regex'
import differenceBy from 'lodash/differenceBy'
import xorBy from 'lodash/xorBy'

import { createMdnsBrowser, getKnownIps } from './mdns-browser'
import { poll, stop, type PollRequest } from './poller'
import {
  createServiceList,
  upsertServiceList,
  updateServiceListByIp,
} from './service-list'

import {
  DEFAULT_PORT,
  updateService,
  fromMdnsBrowser,
  fromResponse,
  makeCandidate,
  toCandidate,
} from './service'

import type { Browser, BrowserService } from 'mdns-js'

import type {
  Candidate,
  Service,
  ServiceList,
  HealthResponse,
  ServerHealthResponse,
  LogLevel,
  Logger,
} from './types'

export * from './types'

type Options = {
  pollInterval?: number,
  services?: Array<Service>,
  candidates?: Array<string | Candidate>,
  nameFilter?: Array<string | RegExp>,
  ipFilter?: Array<string | RegExp>,
  portFilter?: Array<number>,
  logger?: Logger,
}

const log = (logger: ?Logger, level: LogLevel, msg: string, meta?: {}) =>
  logger && typeof logger[level] === 'function' && logger[level](msg, meta)

const santizeRe = (patterns: ?Array<string | RegExp>) => {
  if (!patterns) return []
  return patterns.map(p => (typeof p === 'string' ? escape(p) : p))
}

export const SERVICE_EVENT: 'service' = 'service'
export const SERVICE_REMOVED_EVENT: 'serviceRemoved' = 'serviceRemoved'
export const DEFAULT_POLL_INTERVAL = 5000
export const DEFAULT_DISCOVERY_INTERVAL = 90000
export { DEFAULT_PORT }

const TO_REGEX_OPTS = { contains: true, nocase: true, safe: true }

export class DiscoveryClient extends EventEmitter {
  services: ServiceList
  candidates: Array<Candidate>
  _browser: ?Browser
  _discoveryInterval: IntervalID
  _pollList: Array<Candidate>
  _pollInterval: number
  _pollRequest: ?PollRequest
  _nameFilter: RegExp
  _ipFilter: RegExp
  _portFilter: Array<number>
  _logger: ?Logger

  constructor(options: Options) {
    super()

    // null out ok flag for pre-populated services
    this.services = createServiceList(options.services || [])

    // allow strings instead of full {ip: string, port: ?number} object
    this.candidates = (options.candidates || [])
      .map(c => (typeof c === 'string' ? makeCandidate(c) : c))
      .filter(c => this.services.every(s => s.ip !== c.ip))

    this._browser = null
    this._pollList = []
    this._pollInterval = options.pollInterval || DEFAULT_POLL_INTERVAL
    this._pollRequest = null
    this._nameFilter = toRegex(santizeRe(options.nameFilter), TO_REGEX_OPTS)
    this._ipFilter = toRegex(santizeRe(options.ipFilter), TO_REGEX_OPTS)
    this._portFilter = [DEFAULT_PORT].concat(options.portFilter || [])
    this._logger = options.logger

    log(this._logger, 'silly', 'Created', this)
  }

  start(): DiscoveryClient {
    log(this._logger, 'debug', 'starting discovery client', {})
    this._startBrowser()
    this._poll()
    this._discoveryInterval = setInterval(
      this._rediscover.bind(this),
      DEFAULT_DISCOVERY_INTERVAL
    )

    return this
  }

  stop(): DiscoveryClient {
    log(this._logger, 'debug', 'stopping discovery client', {})
    this._stopBrowser()
    this._stopPoll()
    clearInterval(this._discoveryInterval)

    return this
  }

  add(ip: string, port?: number): DiscoveryClient {
    if (!this.candidates.some(c => c.ip === ip)) {
      const candidate = makeCandidate(ip, port)
      log(this._logger, 'debug', 'adding new unique candidate', { candidate })
      this.candidates = this.candidates.concat(candidate)
      this._poll()
    }

    return this
  }

  remove(name: string): DiscoveryClient {
    const removals = this.services.filter(s => s.name === name)

    this.services = this.services.filter(s => s.name !== name)
    this.candidates = this.candidates.filter(c =>
      removals.every(s => s.ip !== c.ip)
    )

    log(this._logger, 'debug', 'removed services from discovery', { removals })
    this._poll()
    this.emit(SERVICE_REMOVED_EVENT, removals)

    return this
  }

  setCandidates(candidates: Array<string | Candidate>): DiscoveryClient {
    this.candidates = candidates.map(c => {
      if (typeof c === 'string') {
        return makeCandidate(c)
      } else {
        return c
      }
    })
    this._poll(true)
    return this
  }

  setPollInterval(interval: number): DiscoveryClient {
    this._pollInterval = interval || DEFAULT_POLL_INTERVAL
    this._poll(true)

    return this
  }

  _poll(forceRestart?: boolean): void {
    const nextPollList = this.services
      .map(toCandidate)
      .filter(Boolean)
      .concat(this.candidates)

    // only poll if needed
    if (forceRestart || xorBy(this._pollList, nextPollList, 'ip').length) {
      log(this._logger, 'debug', '(re)starting polling', {})

      this._pollList = nextPollList
      stop(this._pollRequest, this._logger)
      this._pollRequest = poll(
        nextPollList,
        this._pollInterval,
        this._handleHealth.bind(this),
        this._logger
      )
    }
  }

  _stopPoll(): void {
    stop(this._pollRequest, this._logger)
    this._pollRequest = null
  }

  _startBrowser(): void {
    this._stopBrowser()

    const browser = createMdnsBrowser()
      .once('ready', () => browser.discover())
      .on('update', service => this._handleUp(service))
      .on('error', error => this.emit('error', error))

    this._browser = browser
  }

  _stopBrowser(): void {
    if (this._browser) {
      this._browser
        .removeAllListeners('ready')
        .removeAllListeners('update')
        .removeAllListeners('error')
        .stop()

      this._browser = null
    }
  }

  _rediscover(): void {
    const knownIps = getKnownIps(this._browser)
    log(this._logger, 'silly', 'refreshing advertising flags', { knownIps })

    const nextServices = this.services.map(s =>
      updateService(s, {
        advertising: knownIps.includes(s.ip),
      })
    )

    this._updateLists(nextServices)
    this._stopBrowser()
    this._startBrowser()
  }

  _handleUp(browserService: BrowserService): void {
    log(this._logger, 'silly', 'mdns service detected', { browserService })
    const service = fromMdnsBrowser(browserService)

    if (service) this._handleService(service)
  }

  _handleHealth(
    candidate: Candidate,
    apiResponse: ?HealthResponse,
    serverResponse: ?ServerHealthResponse
  ): mixed {
    const service = fromResponse(candidate, apiResponse, serverResponse)

    if (service) return this._handleService(service)

    // else, response was not ok, so unset ok flag in all matching ips
    this._updateLists(
      updateServiceListByIp(this.services, candidate.ip, {
        ok: false,
        serverOk: false,
      })
    )
  }

  _handleService(service: Service): mixed {
    if (
      !this._nameFilter.test(service.name) ||
      !this._ipFilter.test(service.ip || '') ||
      !this._portFilter.includes(service.port)
    ) {
      log(this._logger, 'debug', 'Ignoring service', service)
      return
    }

    this._updateLists(upsertServiceList(this.services, service))
  }

  // update this.services, emit if necessary, re-poll if necessary
  _updateLists(nextServices: ServiceList): void {
    const updated = differenceBy(nextServices, this.services)

    if (updated.length) {
      // $FlowFixMe: flow doesn't type differenceBy properly, but this works
      this.candidates = differenceBy(this.candidates, nextServices, 'ip')
      this.services = nextServices
      this._poll()

      log(this._logger, 'silly', 'updated services', { updated })
      this.emit(SERVICE_EVENT, updated)
    }
  }
}

export function createDiscoveryClient(options?: Options): DiscoveryClient {
  return new DiscoveryClient(options || {})
}
