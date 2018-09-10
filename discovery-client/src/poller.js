// @flow
// poller that continuously hits /health of a list of IP ipAddresses

import fetch from 'node-fetch'

import type {Candidate, Logger, HealthResponse} from './types'

export type PollRequest = {
  id: ?IntervalID
}

export function poll (
  candidates: Array<Candidate>,
  interval: number,
  onHealth: (candidate: Candidate, response: ?HealthResponse) => mixed,
  log: ?Logger
): PollRequest {
  if (!candidates.length) return {id: null}

  log && log.debug('poller start', {interval, candidates: candidates.length})

  const subInterval = interval / candidates.length
  const id = setInterval(pollIp, subInterval)
  const request = {id}
  let current = -1

  return request

  function pollIp () {
    const next = getNextCandidate()
    const url = `http://${next.ip}:${next.port}/health`

    fetch(url)
      .then(response => {
        if (!response.ok) return null
        return response.json()
      })
      .catch(error => {
        if (log) {
          const {message, type, code} = error
          log.debug('fetch failed', {url, message, type, code})
        }

        return null
      })
      .then(body => {
        log && log.http('GET', {url, body})
        onHealth(next, body)
      })
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
    log && log.debug('poller stop', {id})
  }
}
