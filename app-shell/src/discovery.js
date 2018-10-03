// @flow
// app shell discovery module
import assert from 'assert'
import Store from 'electron-store'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import throttle from 'lodash/throttle'
import uniqBy from 'lodash/uniqBy'

import DiscoveryClient, {
  SERVICE_EVENT,
  SERVICE_REMOVED_EVENT,
} from '@opentrons/discovery-client'

import {getConfig, getOverrides} from './config'
import createLogger from './log'

import type {Service} from '@opentrons/discovery-client'

// TODO(mc, 2018-08-08): figure out type exports from app
import type {Action} from '@opentrons/app/src/types'
import type {DiscoveredRobot, Connection} from '@opentrons/app/src/discovery/types'

const log = createLogger(__filename)

// TODO(mc, 2018-08-09): values picked arbitrarily and should be researched
const FAST_POLL_INTERVAL_MS = 3000
const SLOW_POLL_INTERVAL_MS = 15000
const UPDATE_THROTTLE_MS = 500

let config
let store
let client

export function registerDiscovery (dispatch: Action => void) {
  const onServiceUpdate = throttle(handleServices, UPDATE_THROTTLE_MS)

  config = getConfig('discovery')
  store = new Store({name: 'discovery', defaults: {services: []}})

  client = DiscoveryClient({
    pollInterval: SLOW_POLL_INTERVAL_MS,
    logger: log,
    candidates: ['[fd00:0:cafe:fefe::1]'].concat(config.candidates),
    services: store.get('services'),
  })

  client
    .on(SERVICE_EVENT, onServiceUpdate)
    .on(SERVICE_REMOVED_EVENT, onServiceUpdate)
    .on('error', error => log.error('discovery error', {error}))
    .start()

  return function handleIncomingAction (action: Action) {
    log.debug('handling action in discovery', {action})

    switch (action.type) {
      case 'discovery:START':
        handleServices()
        return client.setPollInterval(FAST_POLL_INTERVAL_MS).start()
      case 'discovery:FINISH':
        return client.setPollInterval(SLOW_POLL_INTERVAL_MS)
    }
  }

  function handleServices () {
    store.set('services', filterServicesToPersist(client.services))
    dispatch({
      type: 'discovery:UPDATE_LIST',
      payload: {robots: servicesToRobots(client.services)},
    })
  }
}

export function getRobots () {
  if (!client) return []

  return servicesToRobots(client.services)
}

function filterServicesToPersist (services: Array<Service>) {
  const candidateOverrides = getOverrides('discovery.candidates')
  if (!candidateOverrides) return client.services

  const blacklist = [].concat(candidateOverrides)
  return client.services.filter(s => blacklist.every(ip => ip !== s.ip))
}

// TODO(mc, 2018-08-09): exploring moving this to DiscoveryClient
function servicesToRobots (services: Array<Service>): Array<DiscoveredRobot> {
  const servicesByName = groupBy(services, 'name')

  return map(servicesByName, (services: Array<Service>, name) => ({
    name,
    connections: servicesToConnections(services),
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
    port: service.port,
    local: isLocal(service.ip),
  }
}

function isLocal (ip: string): boolean {
  // TODO(mc, 2018-08-09): remove `fd00` check for legacy IPv6 robots
  return (
    ip.startsWith('169.254') ||
    ip.startsWith('[fe80') ||
    ip.startsWith('[fd00') ||
    ip === 'localhost'
  )
}
