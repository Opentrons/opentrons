// @flow
// app shell discovery module
import assert from 'assert'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import uniqBy from 'lodash/uniqBy'

import DiscoveryClient, {
  DEFAULT_PORT,
  SERVICE_EVENT
} from '@opentrons/discovery-client'

import {getConfig} from './config'
import createLogger from './log'

import type {Service} from '@opentrons/discovery-client'

// TODO(mc, 2018-08-08): figure out type exports from app
import type {Action} from '@opentrons/app/src/types'
import type {DiscoveredRobot, Connection} from '@opentrons/app/src/discovery/types'

const log = createLogger(__filename)

const NAME_FILTER = /^opentrons/i

// TODO(mc, 2018-08-09): values picked arbitrarily and should be researched
const FAST_POLL_INTERVAL = 5000
const SLOW_POLL_INTERVAL = 15000

let config
let client

export function registerDiscovery (dispatch: Action => void) {
  config = getConfig('discovery')

  client = DiscoveryClient({
    nameFilter: NAME_FILTER,
    pollInterval: FAST_POLL_INTERVAL,
    logger: log,
    candidates: config.candidates
  })

  client
    .on(SERVICE_EVENT, () => dispatch({
      type: 'discovery:UPDATE_LIST',
      payload: {robots: servicesToRobots(client.services)}
    }))
    .on('error', error => log.error('discovery error', {error}))

  return function handleIncomingAction (action: Action) {
    log.debug('handling action in discovery', {action})

    switch (action.type) {
      case 'discovery:START': return client.start()
      case 'discovery:FINISH': return client.setPollInterval(SLOW_POLL_INTERVAL)
    }
  }
}

// TODO(mc, 2018-08-09): exploring moving this to DiscoveryClient
function servicesToRobots (services: Array<Service>): Array<DiscoveredRobot> {
  const servicesByName = groupBy(services, 'name')

  return map(servicesByName, (services: Array<Service>, name) => ({
    name,
    connections: servicesToConnections(services)
  }))
}

function servicesToConnections (services: Array<Service>): Array<Connection> {
  assert(uniqBy(services, 'name').length <= 1, 'services should have same name')

  return services.map(serviceToConnection).filter(Boolean)
}

function serviceToConnection (service: Service): ?Connection {
  if (!service.ip) return null

  return {
    ip: service.ip,
    ok: service.ok,
    port: service.port || DEFAULT_PORT,
    local: isLocal(service.ip)
  }
}

function isLocal (ip: string): boolean {
  // TODO(mc, 2018-08-09): remove `fd00` check for legacy IPv6 robots
  return (
    ip.startsWith('169.254') ||
    ip.startsWith('fe80') ||
    ip.startsWith('fd00')
  )
}
