// mdns-based api server discovery with direct ethernet connection discovery
import os from 'os'
import net from 'net'
import Bonjour from 'bonjour'

import {actions} from '../actions'
import {getIsScanning} from '../selectors'

// mdns discovery constants
const NAME_RE = /^opentrons/i
const DISCOVERY_TIMEOUT_MS = 30000
const UP_EVENT = 'up'
const DOWN_EVENT = 'down'

// direct discovery constants
// see compute/scripts/setup.sh
const DIRECT_IP = '[fd00:0:cafe:fefe::1]'
const DIRECT_PORT = 31950
const DIRECT_HEALTH_URL = `http://${DIRECT_IP}:${DIRECT_PORT}/health`
const DIRECT_SERVICE = {
  name: 'Opentrons USB',
  ip: DIRECT_IP,
  port: DIRECT_PORT
}
const DIRECT_POLL_INTERVAL_MS = 1000

export function handleDiscover (dispatch, state, action) {
  // don't duplicate discovery requests
  if (getIsScanning(state)) return

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
      dispatch(actions.addDiscovered(serviceWithIp(service)))
    }
  }

  function handleServiceDown (service) {
    if (NAME_RE.test(service.name)) {
      dispatch(actions.removeDiscovered(service.name))
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

// grab IP address from service
// prefer IPv4, then IPv6, then hostname (with override for localhost)
function serviceWithIp (service) {
  const addresses = service.addresses || []
  let ip = addresses.find((address) => net.isIPv4(address))
  if (!ip) ip = addresses.find((address) => net.isIP(address))
  if (!ip) ip = service.host

  // API doesn't listen on all interfaces when running locally
  // this hostname check is only for handling that situation
  if (service.host === os.hostname()) ip = 'localhost'

  return Object.assign({ip}, service)
}
