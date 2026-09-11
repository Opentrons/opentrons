// app shell discovery module
import { app } from 'electron'
import Store from 'electron-store'
import groupBy from 'lodash/groupBy'
import throttle from 'lodash/throttle'

import {
  CLEAR_CACHE,
  DISCOVERY_FINISH,
  DISCOVERY_REMOVE,
  DISCOVERY_RENAME,
  DISCOVERY_START,
} from '@opentrons/app/src/redux/discovery/actions'
import { OPENTRONS_USB } from '@opentrons/app/src/redux/discovery/constants'
import {
  UI_INITIALIZED,
  USB_HTTP_REQUESTS_START,
  USB_HTTP_REQUESTS_STOP,
} from '@opentrons/app/src/redux/shell/actions'
import {
  createDiscoveryClient,
  DEFAULT_PORT,
} from '@opentrons/discovery-client'

import { getFullConfig, handleConfigChange } from './config'
import { createLogger } from './log'
import { handleNotificationConnectionsFor } from './notifications'
import { getSerialPortHttpAgent } from './usb'

import type { ConfigV1 } from '@opentrons/app/src/redux/config/schema-types'
import type {
  Address,
  DiscoveryClient,
  DiscoveryClientRobot,
  LegacyService,
} from '@opentrons/discovery-client'
import type { Action, Dispatch } from './types'

const log = createLogger('discovery')

// TODO(mc, 2018-08-09): values picked arbitrarily and should be researched
const FAST_POLL_INTERVAL_MS = 3000
const SLOW_POLL_INTERVAL_MS = 15000
const UPDATE_THROTTLE_MS = 500

interface DiscoveryStore {
  robots: DiscoveryClientRobot[]
  services?: LegacyService[]
}

interface DiscoveryState {
  config: ConfigV1['discovery']
  store: Store<DiscoveryStore>
  client: DiscoveryClient
  dispatchers: Set<Dispatch>
  primaryDispatcher: Dispatch | null
}

let discoveryState: DiscoveryState | null = null

export function initializeDiscovery(): void {
  if (discoveryState != null) {
    log.warn('Discovery already initialized')
    return
  }

  const state = getDiscoveryState()
  let initialRobots: DiscoveryClientRobot[] = []

  if (!state.config.disableCache) {
    const legacyCachedServices: LegacyService[] | undefined = state.store.get(
      'services',
      // @ts-expect-error(mc, 2021-02-16): tweak these type definitions
      null
    )
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (legacyCachedServices) {
      initialRobots = migrateLegacyServices(legacyCachedServices)
      state.store.delete('services')
    } else {
      initialRobots = state.store.get('robots', [])
    }
  }

  state.client.start({
    initialRobots,
    healthPollInterval: SLOW_POLL_INTERVAL_MS,
    manualAddresses: makeManualAddresses(state.config.candidates),
  })

  handleConfigChange('discovery.candidates', (value: string | string[]) => {
    state.client.start({ manualAddresses: makeManualAddresses(value) })
  })

  handleConfigChange('discovery.disableCache', (value: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
    if (value === true) {
      state.config.disableCache = value
      state.store.set('robots', [])
      clearClientRobotCache()
    }
  })

  app.once('will-quit', () => {
    state.client.stop()
  })

  log.debug('Discovery initialized')
}

// Register a dispatcher to mediate discovery client actions.
// See createPrimaryActionHandler.
export function registerDiscoveryMainWindow(
  dispatch: Dispatch
): (action: Action) => unknown {
  const state = getDiscoveryState()

  if (state.primaryDispatcher != null) {
    log.error(
      'Attempted to register main window discovery when primary dispatcher already exists.'
    )
    return createSecondaryActionHandler()
  }

  state.primaryDispatcher = dispatch
  state.dispatchers.add(dispatch)

  const robots = state.client.getRobots()
  dispatch({
    type: 'discovery:UPDATE_LIST',
    payload: { robots },
  })

  return createPrimaryActionHandler(state)
}

// Register a dispatcher as a "listener". This dispatcher only receives
// discovery updates. Only the primary dispatcher (the main window) should
// drive discovery client behavior.
export function registerDiscoverySecondaryWindow(
  dispatch: Dispatch
): (action: Action) => unknown {
  const state = getDiscoveryState()

  state.dispatchers.add(dispatch)

  const robots = state.client.getRobots()
  dispatch({
    type: 'discovery:UPDATE_LIST',
    payload: { robots },
  })

  return createSecondaryActionHandler()
}

export function unregisterDiscovery(dispatch: Dispatch): void {
  if (discoveryState != null) {
    if (discoveryState.primaryDispatcher === dispatch) {
      log.error(
        'Attempted to unregister the primary dispatch, the main window.'
      )
    } else {
      discoveryState.dispatchers.delete(dispatch)
    }
  }
}

const migrateLegacyServices = (
  legacyServices: LegacyService[]
): DiscoveryClientRobot[] => {
  const servicesByName = groupBy<LegacyService>(legacyServices, 'name')
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
              advertisedModel: null,
            },
          ]
        : []
    })
    return { name, health: null, serverHealth: null, addresses }
  })
}

const makeManualAddresses = (addrs: string | string[]): Address[] => {
  return ['fd00:0:cafe:fefe::1']
    .concat(addrs)
    .map(ip => ({ ip, port: DEFAULT_PORT }))
}

const getDiscoveryState = (): DiscoveryState => {
  if (discoveryState != null) {
    return discoveryState
  }

  const config = getFullConfig().discovery
  const store = new Store({
    name: 'discovery',
    defaults: { robots: [] as DiscoveryClientRobot[] },
  })

  const dispatchers = new Set<Dispatch>()

  const handleRobots = (): void => {
    const robots = discoveryState?.client.getRobots() ?? []
    handleNotificationConnectionsFor(robots)
    if (!config.disableCache) store.set('robots', robots)

    dispatchers.forEach(dispatcher => {
      dispatcher({
        type: 'discovery:UPDATE_LIST',
        payload: { robots },
      })
    })
  }

  const handleRobotListChange = throttle(handleRobots, UPDATE_THROTTLE_MS)

  const client = createDiscoveryClient({
    onListChange: handleRobotListChange,
    logger: log,
  })

  discoveryState = {
    config,
    store,
    client,
    dispatchers,
    primaryDispatcher: null,
  }

  return discoveryState
}

// Only one dispatcher, the primary action handler (ie, the main window), should mediate
// discovery client actions. This prevents duplicated discovery actions that may
// lead to unexpected behavior.
function createPrimaryActionHandler(
  state: DiscoveryState
): (action: Action) => void {
  const handleRobots = (): void => {
    const robots = state.client.getRobots()

    handleNotificationConnectionsFor(robots)

    if (!state.config.disableCache) {
      state.store.set('robots', robots)
    }

    state.dispatchers.forEach(dispatcher => {
      dispatcher({
        type: 'discovery:UPDATE_LIST',
        payload: { robots },
      })
    })
  }

  const clearCache = (): void => {
    state.client.start({ initialRobots: [], manualAddresses: [] })
  }

  return function handleIncomingAction(action: Action) {
    log.debug('handling action in discovery (primary)', { action })

    switch (action.type) {
      case UI_INITIALIZED:
      case DISCOVERY_START: {
        handleRobots()
        state.client.start({
          healthPollInterval: FAST_POLL_INTERVAL_MS,
        })
        return
      }
      case DISCOVERY_FINISH: {
        state.client.start({
          healthPollInterval: SLOW_POLL_INTERVAL_MS,
        })
        return
      }
      case DISCOVERY_REMOVE: {
        state.client.removeRobot(
          (action.payload as { robotName: string }).robotName
        )
        return
      }
      case DISCOVERY_RENAME: {
        const { prevName, newName } = action.payload as {
          prevName: string
          newName: string
        }
        state.client.renameRobot(prevName, newName)
        return
      }
      case CLEAR_CACHE: {
        clearCache()
        return
      }
      case USB_HTTP_REQUESTS_START: {
        const usbHttpAgent = getSerialPortHttpAgent()

        state.client.start({
          healthPollInterval: FAST_POLL_INTERVAL_MS,
          manualAddresses: [
            {
              ip: OPENTRONS_USB,
              port: DEFAULT_PORT,
              agent: usbHttpAgent,
            },
          ],
        })
        break
      }
      case USB_HTTP_REQUESTS_STOP: {
        state.client.start({
          healthPollInterval: FAST_POLL_INTERVAL_MS,
          manualAddresses: [
            {
              ip: OPENTRONS_USB,
              port: DEFAULT_PORT,
            },
          ],
        })
        break
      }
    }
  }
}

// Secondary dispatchers don't handle client control actions.
function createSecondaryActionHandler(): (action: Action) => void {
  return function handleIncomingAction(action: Action) {
    log.debug('handling action in discovery (secondary - no-op)', { action })
  }
}

function clearClientRobotCache(): void {
  const state = getDiscoveryState()
  state.client.start({ initialRobots: [], manualAddresses: [] })
}

export function __resetDiscoveryForTesting(): void {
  discoveryState = null
}
