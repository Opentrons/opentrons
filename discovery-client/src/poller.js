// @flow
// poller that continuously hits /health of a list of IP ipAddresses

import fetch from 'node-fetch'

import type {
  Candidate,
  HealthResponse,
  Logger,
  ServerHealthResponse,
} from './types'

type HealthHandler = (
  candidate: Candidate,
  apiResponse: ?HealthResponse,
  serverResponse: ?ServerHealthResponse
) => mixed

export type PollRequest = {
  id: ?IntervalID,
}

const MIN_SUBINTERVAL_MS = 100
const MIN_TIMEOUT_MS = 30000

export function poll(
  candidates: Array<Candidate>,
  interval: number,
  onHealth: HealthHandler,
  log: ?Logger
): PollRequest {
  if (!candidates.length) return { id: null }

  log && log.debug('poller start', { interval, candidates: candidates.length })

  const subInterval = Math.max(interval / candidates.length, MIN_SUBINTERVAL_MS)
  const timeout = Math.max(subInterval * candidates.length, MIN_TIMEOUT_MS)

  const id = setInterval(pollIp, subInterval)
  const request = { id }
  let current = -1

  return request

  function pollIp() {
    const next = getNextCandidate()

    fetchHealth(next, timeout, log).then(([apiRes, serverRes]) =>
      onHealth(next, apiRes, serverRes)
    )
  }

  function getNextCandidate() {
    current += 1

    if (current > candidates.length - 1) {
      current = 0
    }

    return candidates[current]
  }
}

export function stop(request: ?PollRequest, log: ?Logger) {
  const id = request && request.id

  if (id) {
    clearInterval(id)
    log && log.debug('poller stop', { id })
  }
}

function fetchHealth(cand: Candidate, timeout: number, log: ?Logger) {
  const apiHealthUrl = `http://${cand.ip}:${cand.port}/health`
  const serverHealthUrl = `http://${cand.ip}:${cand.port}/server/update/health`

  return Promise.all([
    fetchAndParseBody(apiHealthUrl, timeout, log),
    fetchAndParseBody(serverHealthUrl, timeout, log),
  ])
}

function fetchAndParseBody(url, timeout, log: ?Logger) {
  return fetch(url, { timeout })
    .then(response => (response.ok ? response.json() : null))
    .then(body => {
      log && log.silly('GET', { url, body })
      return body
    })
    .catch(error => {
      const { message, type, code } = error
      log && log.silly('GET failed', { url, message, type, code })
      return null
    })
}
