// @flow
import net from 'net'
import fetch from 'node-fetch'
import intersectionBy from 'lodash/intersectionBy'
import unionBy from 'lodash/unionBy'
import xorBy from 'lodash/xorBy'

import {
  ROBOT_SERVER_HEALTH_PATH,
  UPDATE_SERVER_HEALTH_PATH,
} from './constants'

import type {
  HealthPoller,
  HealthPollerTarget,
  HealthPollerConfig,
  HealthPollerOptions,
  HealthPollerResult,
  HealthResponse,
  ServerHealthResponse,
  LogLevel,
} from './types'

const DEFAULT_REQUEST_OPTS = { timeout: 10000 }

/**
 * Create a HealthPoller to monitor the health of a set of IP addresses
 */
export function createHealthPoller(options: HealthPollerOptions): HealthPoller {
  const { onPollResult, logger } = options
  const log = (level: LogLevel, msg: string, meta: {} = {}) => {
    typeof logger?.[level] === 'function' && logger[level](msg, meta)
  }

  let interval = 0
  let pollQueue: Array<HealthPollerTarget> = []
  let pollIntervalId: IntervalID | null = null
  let lastCompletedPollTimeByIp: { [ip: string]: number | void, ... } = {}

  const pollAndNotify = (ip, port) => {
    log('silly', 'Polling health', { ip, port })

    const pollTime = Date.now()

    return pollHealth(ip, port)
      .then(result => {
        const lastPollTime = lastCompletedPollTimeByIp[ip] ?? 0

        // only notify if the poll result is the freshest result available and
        // polling is currently active
        if (pollTime > lastPollTime && pollIntervalId !== null) {
          log('silly', 'Poll completed', { ip, port, result })
          onPollResult(result)
          lastCompletedPollTimeByIp[ip] = pollTime
        } else {
          log('debug', 'Stale poll result ignored', { ip, port, result })
        }
      })
      .catch((e: Error) => {
        log('error', 'Unexpected poll error', { ip, port, message: e.message })
      })
  }

  const start = (config?: HealthPollerConfig) => {
    const { interval: nextInterval, list: nextList } = config ?? {}
    let needsNewInterval = pollIntervalId === null

    if (nextInterval != null && nextInterval !== interval) {
      interval = nextInterval
      needsNewInterval = true
    }

    // if xor (symmetric difference) returns values, then elements exist in
    // one list and not the other and need to be added to and/or removed from the queue
    if (nextList && xorBy(pollQueue, nextList, 'ip').length > 0) {
      // keeping the order of `pollQueue`, remove all elements that aren't
      // in the new list via `intersection`, then add new elements via `union`
      pollQueue = unionBy(
        intersectionBy(pollQueue, nextList, 'ip'),
        nextList,
        'ip'
      )
      needsNewInterval = true
    }

    if (needsNewInterval && pollQueue.length > 0 && interval > 0) {
      const handlePoll = () => {
        // since we're using a mutable array as a queue, guard against unsafe
        // array access before we start shifting and pushing
        if (pollQueue.length > 0) {
          // take the head of the queue out and put it back in at the end
          const head = pollQueue.shift()
          pollQueue.push(head)
          pollAndNotify(head.ip, head.port)
        }
      }

      stop()
      log('debug', 'starting new health poll interval')
      pollIntervalId = setInterval(handlePoll, interval / pollQueue.length)
    } else {
      log('debug', 'poller (re)start called but no new interval needed')
    }
  }

  const stop = () => {
    log('debug', 'stopping health poller')
    lastCompletedPollTimeByIp = {}
    clearInterval(pollIntervalId)
    pollIntervalId = null
  }

  return { start, stop }
}

type FetchAndParseResult<SuccessBody> =
  | {| ok: true, status: number, body: SuccessBody |}
  | {| ok: false, status: number, body: string | { ... } |}

/**
 * Fetch a URL and parse its response to JSON if possible. If the body can't
 * be parsed, return the string body to preserve non-JSON NGINX responses
 */
function fetchAndParse<SuccessBody>(
  url: string
): Promise<FetchAndParseResult<SuccessBody>> {
  return fetch(url, DEFAULT_REQUEST_OPTS)
    .then(resp => {
      const { ok, status } = resp

      return resp
        .text()
        .catch((e: Error) => `Unable to read response body: ${e.message}`)
        .then(text => {
          try {
            return JSON.parse(text)
          } catch (e) {
            return text
          }
        })
        .then(body => ({ ok, status, body }: any))
    })
    .catch((error: { type?: string, code?: string, message: string, ... }) => {
      // error.type === 'system' means error came from Node.js (e.g. EHOSTDOWN).
      // if it was a system error, skip error.message and attach the error code.
      // error.message may have timestamps or other frequently changing info
      const body =
        error.type === 'system' && typeof error.code === 'string'
          ? `Request failed, reason: ${error.code}`
          : error.message

      return { ok: false, status: -1, body }
    })
}

/**
 * Poll both /heath and /server/update/health of an IP address and combine the
 * responses into a single result object
 */
function pollHealth(ip: string, port: number): Promise<HealthPollerResult> {
  // IPv6 addresses require brackets
  const urlIp = net.isIPv6(ip) ? `[${ip}]` : ip

  const healthReq = fetchAndParse<HealthResponse>(
    `http://${urlIp}:${port}${ROBOT_SERVER_HEALTH_PATH}`
  )
  const serverHealthReq = fetchAndParse<ServerHealthResponse>(
    `http://${urlIp}:${port}${UPDATE_SERVER_HEALTH_PATH}`
  )

  return Promise.all([healthReq, serverHealthReq]).then(
    ([healthResp, serverHealthResp]) => ({
      ip,
      port,
      health: healthResp.ok ? healthResp.body : null,
      serverHealth: serverHealthResp.ok ? serverHealthResp.body : null,
      healthError: !healthResp.ok
        ? { status: healthResp.status, body: healthResp.body }
        : null,
      serverHealthError: !serverHealthResp.ok
        ? { status: serverHealthResp.status, body: serverHealthResp.body }
        : null,
    })
  )
}
