// mdns-based api server discovery with direct ethernet connection discovery
import os from 'os'
import net from 'net'
import Bonjour from 'bonjour'

// import directly from health to avoid importing other parts
// of the api client (most importantly, the electron remote)
import {fetchHealth} from '../../http-api-client/health'

import {actions} from '../actions'

// mdns discovery constants
const NAME_RE = /^opentrons/i
const DISCOVERY_TIMEOUT_MS = 30000
const UP_EVENT = 'up'
const DOWN_EVENT = 'down'

// direct discovery constants
// see compute/scripts/setup.sh
const DIRECT_SERVICE = {
  name: 'Opentrons USB',
  ip: '[fd00:0:cafe:fefe::1]',
  port: 31950,
  wired: true
}
const DIRECT_POLL_INTERVAL_MS = 1000

const SKIP_WIRED_POLL = process.env.SKIP_WIRED_POLL

export function handleDiscover (dispatch, state, action) {
  // disable legacy discovery if new discovery feature flag is set
  if (state.config.discovery.enabled) return

  // don't duplicate discovery requests
  // TODO(mc, 2018-09-10): did not use selector to avoid circular dependency
  // this file is getting ditched so ¯\_(ツ)_/¯
  if (state.discovery.scanning) return

  // TODO(mc, 2017-10-26): we're relying right now on the fact that resin
  // advertises an SSH service. Instead, we should be registering an HTTP
  // service on port 31950 and listening for that instead
  const browser = Bonjour().find({type: 'http'})
    .on(UP_EVENT, handleServiceUp)
    .on(DOWN_EVENT, handleServiceDown)

  let pollInterval
  if (!SKIP_WIRED_POLL) {
    pollInterval = setInterval(pollDirectConnection, DIRECT_POLL_INTERVAL_MS)
  }

  setTimeout(finishDiscovery, DISCOVERY_TIMEOUT_MS)

  function handleServiceUp (service) {
    if (NAME_RE.test(service.name)) {
      const serviceWithIp = withIp(service)
      dispatch(actions.addDiscovered(serviceWithIp))

      // fetchHealth is a thunk action, so give it dispatch
      return fetchHealth(serviceWithIp)(dispatch)
    }
  }

  function handleServiceDown (service) {
    if (NAME_RE.test(service.name)) {
      dispatch(actions.removeDiscovered(service))
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
    fetchHealth(DIRECT_SERVICE)(dispatch).then(result => {
      const action = result.type === 'api:SUCCESS'
        ? actions.addDiscovered(DIRECT_SERVICE)
        : actions.removeDiscovered(DIRECT_SERVICE)
      dispatch(action)
    })
  }
}

// grab IP address from service
// prefer IPv4, then IPv6, then hostname (with override for localhost)
function withIp (service) {
  if (service.ip) return service

  const addresses = service.addresses || []
  let ip = addresses.find((address) => net.isIPv4(address))
  if (!ip) ip = addresses.find((address) => net.isIP(address))
  if (!ip) ip = service.host

  // API doesn't listen on all interfaces when running locally
  // this hostname check is only for handling that situation
  if (service.host && service.host.endsWith(os.hostname())) {
    ip = 'localhost'
    // emulate a wired robot when running locally
    service = {...service, wired: true}
  }

  return Object.assign({ip}, service)
}
