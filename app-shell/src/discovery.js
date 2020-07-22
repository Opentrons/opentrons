// @flow
// app shell discovery module
import { app } from 'electron'
import Store from 'electron-store'
import groupBy from 'lodash/groupBy'
import throttle from 'lodash/throttle'

import {
  createDiscoveryClient,
  DEFAULT_PORT,
} from '@opentrons/discovery-client'

import { UI_INITIALIZED } from '@opentrons/app/src/shell/actions'
import {
  DISCOVERY_START,
  DISCOVERY_FINISH,
  DISCOVERY_REMOVE,
  CLEAR_CACHE,
} from '@opentrons/app/src/discovery/actions'

import { getFullConfig, handleConfigChange } from './config'
import { createLogger } from './log'
import { createNetworkInterfaceMonitor } from './system-info'

import type {
  DiscoveryClientRobot,
  LegacyService,
} from '@opentrons/discovery-client'
import type { Action, Dispatch } from './types'

const log = createLogger('discovery')

// TODO(mc, 2018-08-09): values picked arbitrarily and should be researched
const FAST_POLL_INTERVAL_MS = 3000
const SLOW_POLL_INTERVAL_MS = 15000
const UPDATE_THROTTLE_MS = 500
const IFACE_MONITOR_SLOW_INTERVAL_MS = 30000
const IFACE_MONITOR_FAST_INTERVAL_MS = 5000

let config
let store
let client

const makeManualAddresses = (addrs: string | Array<string>) => {
  return ['fd00:0:cafe:fefe::1']
    .concat(addrs)
    .map(ip => ({ ip, port: DEFAULT_PORT }))
}

const migrateLegacyServices = (
  legacyServices: Array<LegacyService>
): Array<DiscoveryClientRobot> => {
  const servicesByName = groupBy<string, LegacyService>(legacyServices, 'name')

  return Object.keys(servicesByName).map((name: string) => {
    const services = servicesByName[name]
    const addresses = services.flatMap((service: LegacyService) => {
      const { ip, port } = service
      return ip != null
        ? [
            {
              ip,
              port,
              seen: false,
              healthStatus: null,
              serverHealthStatus: null,
              healthError: null,
              serverHealthError: null,
            },
          ]
        : []
    })

    return { name, health: null, serverHealth: null, addresses }
  })
}

export function registerDiscovery(dispatch: Dispatch): Action => mixed {
  const handleRobotListChange = throttle(handleRobots, UPDATE_THROTTLE_MS)

  config = getFullConfig().discovery
  store = new Store({ name: 'discovery', defaults: { robots: [] } })

  let disableCache = config.disableCache
  let initialRobots: Array<DiscoveryClientRobot> = []

  if (!disableCache) {
    const legacyCachedServices: Array<LegacyService> | null = store.get(
      'services',
      null
    )

    if (legacyCachedServices) {
      initialRobots = migrateLegacyServices(legacyCachedServices)
      store.delete('services')
    } else {
      initialRobots = store.get('robots', [])
    }
  }

  client = createDiscoveryClient({
    onListChange: handleRobotListChange,
    logger: log,
  })

  client.start({
    initialRobots,
    healthPollInterval: SLOW_POLL_INTERVAL_MS,
    manualAddresses: makeManualAddresses(config.candidates),
  })

  handleConfigChange(
    'discovery.candidates',
    (value: string | Array<string>) => {
      client.start({ manualAddresses: makeManualAddresses(value) })
    }
  )

  handleConfigChange('discovery.disableCache', (value: boolean) => {
    if (value === true) {
      disableCache = value
      store.set('robots', [])
      clearCache()
    }
  })

  let ifaceMonitor
  const startIfaceMonitor = pollInterval => {
    ifaceMonitor && ifaceMonitor.stop()
    ifaceMonitor = createNetworkInterfaceMonitor({
      pollInterval,
      onInterfaceChange: () => client.start({}),
    })
  }

  app.once('will-quit', () => {
    ifaceMonitor && ifaceMonitor.stop()
    client.stop()
  })

  startIfaceMonitor(IFACE_MONITOR_SLOW_INTERVAL_MS)

  return function handleIncomingAction(action: Action) {
    log.debug('handling action in discovery', { action })

    switch (action.type) {
      case UI_INITIALIZED:
      case DISCOVERY_START:
        handleRobots()
        startIfaceMonitor(IFACE_MONITOR_FAST_INTERVAL_MS)
        return client.start({ healthPollInterval: FAST_POLL_INTERVAL_MS })

      case DISCOVERY_FINISH:
        startIfaceMonitor(IFACE_MONITOR_SLOW_INTERVAL_MS)
        return client.start({ healthPollInterval: SLOW_POLL_INTERVAL_MS })

      case DISCOVERY_REMOVE:
        return client.removeRobot(action.payload.robotName)

      case CLEAR_CACHE:
        return clearCache()
    }
  }

  function handleRobots() {
    const robots = client.getRobots()

    if (!disableCache) store.set('robots', robots)

    dispatch({
      type: 'discovery:UPDATE_LIST',
      payload: { robots },
    })
  }

  function clearCache() {
    client.start({ initialRobots: [] })
  }
}
