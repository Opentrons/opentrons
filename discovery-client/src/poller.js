// @flow
// poller that continuously hits /health of a list of IP ipAddresses

import fetch from 'node-fetch'

import type { Candidate, Logger, HealthResponse } from './types'

type HealthHandler = (
  candidate: Candidate,
  apiResponse: ?HealthResponse,
  serverResponse: ?HealthResponse
) => mixed

export type PollRequest = {
  id: ?IntervalID
}

export function poll (
  candidates: Array<Candidate>,
  interval: number,
  onHealth: HealthHandler,
  log: ?Logger
): PollRequest {
  if (!candidates.length) return { id: null }

  log && log.debug('poller start', { interval, candidates: candidates.length })

  const subInterval = interval / candidates.length
  const id = setInterval(pollIp, subInterval)
  const request = { id }
  let current = -1

  return request

  function pollIp () {
    const next = getNextCandidate()

    fetchHealth(next, log).then(([apiRes, serverRes]) =>
      onHealth(next, apiRes, serverRes)
    )
  }

  function getNextCandidate () {
    current += 1

    if (current > candidates.length - 1) {
      current = 0
    }

    return candidates[current]
  }
}

export function stop (request: ?PollRequest, log: ?Logger) {
  const id = request && request.id

  if (id) {
    clearInterval(id)
    log && log.debug('poller stop', { id })
  }
}

function fetchHealth (cand: Candidate, log: ?Logger) {
  const apiHealthUrl = `http://${cand.ip}:${cand.port}/health`
  const serverHealthUrl = `http://${cand.ip}:${cand.port}/server/health`

  return Promise.all([
    fetchAndParseBody(apiHealthUrl, log),
    fetchAndParseBody(serverHealthUrl, log)
  ])
}

function fetchAndParseBody (url, log: ?Logger) {
  return fetch(url)
    .then(response => (response.ok ? response.json() : null))
    .then(body => {
      log && log.silly('GET', { url, body })
      return body
    })
    .catch(error => {
      const { message, type, code } = error
      log && log.http('GET failed', { url, message, type, code })
      return null
    })
}
