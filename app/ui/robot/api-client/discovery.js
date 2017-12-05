// mdns-based api server discovery with direct ethernet connection discovery
import Bonjour from 'bonjour'

import {actions} from '../actions'

// mdns discovery constants
const NAME_RE = /^opentrons/i
const DISCOVERY_TIMEOUT_MS = 30000
const UP_EVENT = 'up'
const DOWN_EVENT = 'down'

// direct discovery constants
// see compute/scripts/setup.sh
const DIRECT_HOST = '[fd00:0:cafe:fefe::1]'
const DIRECT_PORT = 31950
const DIRECT_HEALTH_URL = `http://${DIRECT_HOST}:${DIRECT_PORT}/health`
const DIRECT_SERVICE = {
  name: 'Opentrons USB',
  host: DIRECT_HOST,
  port: DIRECT_PORT
}
const DIRECT_POLL_INTERVAL_MS = 1000

export function handleDiscover (dispatch, state, action) {
  // TODO(mc, 2017-10-26): we're relying right now on the fact that resin
  // advertises an SSH service. Instead, we should be registering an HTTP
  // service on port 31950 and listening for that instead
  const browser = Bonjour().find({type: 'http'})
  let pollInterval

  pollInterval = setInterval(pollDirectConnection, DIRECT_POLL_INTERVAL_MS)
  setTimeout(finishDiscovery, DISCOVERY_TIMEOUT_MS)
  browser.on(UP_EVENT, handleServiceUp)
  browser.on(DOWN_EVENT, handleServiceDown)

  function handleServiceUp (service) {
    if (NAME_RE.test(service.name)) {
      dispatch(actions.addDiscovered(service))
    }
  }

  function handleServiceDown (service) {
    if (NAME_RE.test(service.name)) {
      dispatch(actions.removeDiscovered(service.host))
    }
  }

  function finishDiscovery () {
    browser.removeListener(UP_EVENT, handleServiceUp)
    browser.removeListener(DOWN_EVENT, handleServiceDown)
    browser.stop()
    clearInterval(pollInterval)
    dispatch(actions.discoverFinish())
  }

  function pollDirectConnection () {
    fetch(DIRECT_HEALTH_URL)
      .then((response) => {
        if (response.ok) dispatch(actions.addDiscovered(DIRECT_SERVICE))
      })
      .catch(() => {})
  }
}
