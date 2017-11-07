// mdns-based api server discovery
import Bonjour from 'bonjour'

import {actions} from '../actions'

const NAME_RE = /^opentrons/i
const DISCOVERY_TIMEOUT_MS = 30000
const UP_EVENT = 'up'
const DOWN_EVENT = 'down'

export function handleDiscover (dispatch, state, action) {
  // TODO(mc, 2017-10-26): we're relying right now on the fact that resin
  // advertises an SSH service. Instead, we should be registering an HTTP
  // service on port 31950 and listening for that instead
  const browser = Bonjour().find({type: 'ssh'})

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
    dispatch(actions.discoverFinish())
  }
}
