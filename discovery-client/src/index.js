// @flow
// opentrons robot service discovery client
// finds robots on the network via mdns

import EventEmitter from 'events'
import Bonjour from 'bonjour'

import {poll, stop, type PollRequest} from './poller'
import {
  DEFAULT_PORT,
  fromMdnsBrowser,
  fromResponse,
  toCandidate,
  matchService,
  matchConflict,
  matchCandidate,
  rejectCandidate
} from './service'

import type {Browser, BrowserService} from 'bonjour'
import type {Candidate, Service, HealthResponse, LogLevel, Logger} from './types'

export * from './types'

type Options = {
  pollInterval?: number,
  services?: Array<Service>,
  candidates?: Array<string | Candidate>,
  nameFilter?: string | RegExp,
  allowedPorts?: Array<number>,
  logger?: Logger,
}

export default function DiscoveryClientFactory (options?: Options) {
  return new DiscoveryClient(options || {})
}

export const SERVICE_EVENT: 'service' = 'service'
export const SERVICE_REMOVED_EVENT: 'serviceRemoved' = 'serviceRemoved'
export const DEFAULT_POLL_INTERVAL = 5000

const log = (logger: ?Logger, level: LogLevel, msg: string, meta?: {}) =>
  logger && typeof logger[level] === 'function' && logger[level](msg, meta)

export class DiscoveryClient extends EventEmitter {
  services: Array<Service>
  candidates: Array<Candidate>
  _browser: ?Browser
  _pollRequest: ?PollRequest
  _pollInterval: number
  _nameFilter: RegExp
  _allowedPorts: Array<number>
  _logger: ?Logger

  constructor (options: Options) {
    super()

    // null out ok flag for pre-populated services
    this.services = (options.services || []).map(s => ({...s, ok: null}))

    // allow strings instead of full {ip: string, port: ?number} object
    this.candidates = (options.candidates || [])
      .map(c => (typeof c === 'string' ? {ip: c, port: null} : c))
      .filter(c => this.services.every(s => s.ip !== c.ip))

    this._pollInterval = options.pollInterval || DEFAULT_POLL_INTERVAL
    this._nameFilter = new RegExp(options.nameFilter || '')
    this._allowedPorts = [DEFAULT_PORT].concat(options.allowedPorts || [])
    this._logger = options.logger
    this._browser = null
  }

  start (): DiscoveryClient {
    log(this._logger, 'debug', 'starting discovery client', {})
    this._startBrowser()
    this._poll()

    return this
  }

  stop (): DiscoveryClient {
    log(this._logger, 'debug', 'stopping discovery client', {})
    if (this._browser) this._browser.stop()
    stop(this._pollRequest)
    this._pollRequest = null

    return this
  }

  add (ip: string, port?: number): DiscoveryClient {
    if (!this.candidates.some(c => c.ip === ip)) {
      const candidate = {ip, port: port || null}
      log(this._logger, 'debug', 'adding new unique candidate', {candidate})
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

    log(this._logger, 'debug', 'removed services from discovery', {removals})
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
    stop(this._pollRequest)
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

  _startBrowser (): void {
    if (this._browser) return this._browser.start()

    // the bonjour browser calls `start` in its constructor
    this._browser = Bonjour()
      .find({type: 'http'})
      .on('up', this._handleUp.bind(this))
      .on('error', e => this.emit('error', e))
  }

  _handleUp (browserService: BrowserService): void {
    log(this._logger, 'debug', 'mdns service detected', {browserService})

    if (
      this._nameFilter.test(browserService.name) &&
      this._allowedPorts.includes(browserService.port)
    ) {
      this._handleService(fromMdnsBrowser(browserService))
    }
  }

  _handleHealth (candidate: Candidate, response: ?HealthResponse): mixed {
    const service = fromResponse(candidate, response)

    if (service) return this._handleService(service)

    // else, response was not ok, so unset ok flag in all matching ips
    const {ip} = candidate
    const nextServices = this.services
      .map(s => (s.ip === ip && s.ok !== false) ? {...s, ok: false} : s)

    this._updateServiceList(nextServices)
  }

  _handleService (service: Service): mixed {
    const candidateExists = this.candidates.some(matchCandidate(service))
    const existingService = this.services.find(matchService(service))
    const serviceConflicts = this.services.filter(matchConflict(service))
    let nextServices = this.services

    // add service if necessary
    if (!existingService) nextServices = nextServices.concat(service)

    // update existing services and null out conflics
    nextServices = nextServices.map(s => {
      if (s === existingService && s.ok !== service.ok) return service
      if (serviceConflicts.includes(s)) return {...s, ip: null, ok: null}
      return s
    })

    // promote candidates and update service list
    this.candidates = this.candidates.filter(rejectCandidate(service))
    this._updateServiceList(nextServices, candidateExists)
  }

  // update this.services, emit if necessary, return number of services updated
  _updateServiceList (nextServices: Array<Service>, forcePoll?: boolean): void {
    const updated = nextServices.filter((s, i) => s !== this.services[i])
    this.services = nextServices

    if (forcePoll || updated.length) this._poll()
    if (updated.length) {
      updated.forEach(s => this.emit(SERVICE_EVENT, s))
      log(this._logger, 'debug', 'updated services', {services: this.services})
    }
  }
}
