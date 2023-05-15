// app shell discovery module
import { app } from 'electron'
import Store from 'electron-store'
import groupBy from 'lodash/groupBy'
import throttle from 'lodash/throttle'

import {
  createDiscoveryClient,
  DEFAULT_PORT,
} from '@opentrons/discovery-client'
import {
  UI_INITIALIZED,
  USB_HTTP_REQUESTS_START,
  USB_HTTP_REQUESTS_STOP,
} from '@opentrons/app/src/redux/shell/actions'
import {
  DISCOVERY_START,
  DISCOVERY_FINISH,
  DISCOVERY_REMOVE,
  CLEAR_CACHE,
} from '@opentrons/app/src/redux/discovery/actions'
import { OPENTRONS_USB } from '@opentrons/app/src/redux/discovery/constants'

import { getFullConfig, handleConfigChange } from './config'
import { createLogger } from './log'
import { getSerialPortHttpAgent } from './usb'

import type {
  Address,
  DiscoveryClientRobot,
  LegacyService,
  DiscoveryClient,
} from '@opentrons/discovery-client'

import type { Action, Dispatch } from './types'
import type { Config } from './config'

const log = createLogger('discovery')

// TODO(mc, 2018-08-09): values picked arbitrarily and should be researched
const FAST_POLL_INTERVAL_MS = 3000
const SLOW_POLL_INTERVAL_MS = 15000
const UPDATE_THROTTLE_MS = 500

interface DiscoveryStore {
  robots: DiscoveryClientRobot[]
  services?: LegacyService[]
}

let config: Config['discovery']
let store: Store<DiscoveryStore>
let client: DiscoveryClient

const makeManualAddresses = (addrs: string | string[]): Address[] => {
  return ['fd00:0:cafe:fefe::1']
    .concat(addrs)
    .map(ip => ({ ip, port: DEFAULT_PORT }))
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

export function registerDiscovery(
  dispatch: Dispatch
): (action: Action) => unknown {
  const handleRobotListChange = throttle(handleRobots, UPDATE_THROTTLE_MS)

  config = getFullConfig().discovery
  store = new Store({
    name: 'discovery',
    defaults: { robots: [] as DiscoveryClientRobot[] },
  })

  let disableCache = config.disableCache
  let initialRobots: DiscoveryClientRobot[] = []

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!disableCache) {
    const legacyCachedServices: LegacyService[] | undefined = store.get(
      'services',
      // @ts-expect-error(mc, 2021-02-16): tweak these type definitions
      null
    )

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
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

  handleConfigChange('discovery.candidates', (value: string | string[]) => {
    client.start({ manualAddresses: makeManualAddresses(value) })
  })

  handleConfigChange('discovery.disableCache', (value: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
    if (value === true) {
      disableCache = value
      store.set('robots', [])
      clearCache()
    }
  })

  app.once('will-quit', () => {
    client.stop()
  })

  function removeCachedUsbRobot(): void {
    const cachedUsbRobotName = client
      .getRobots()
      .find(robot =>
        robot.addresses.some(address => address.ip === OPENTRONS_USB)
      )?.name

    if (cachedUsbRobotName != null) {
      log.debug(
        `deleting old opentrons-usb entry with name ${cachedUsbRobotName}`
      )
      client.removeRobot(cachedUsbRobotName)
    }
  }

  return function handleIncomingAction(action: Action) {
    log.debug('handling action in discovery', { action })

    switch (action.type) {
      case UI_INITIALIZED:
      case DISCOVERY_START: {
        handleRobots()
        return client.start({
          healthPollInterval: FAST_POLL_INTERVAL_MS,
        })
      }
      case DISCOVERY_FINISH: {
        return client.start({
          healthPollInterval: SLOW_POLL_INTERVAL_MS,
        })
      }
      case DISCOVERY_REMOVE: {
        return client.removeRobot(
          (action.payload as { robotName: string }).robotName
        )
      }
      case CLEAR_CACHE: {
        return clearCache()
      }
      case USB_HTTP_REQUESTS_START: {
        removeCachedUsbRobot()

        const usbHttpAgent = getSerialPortHttpAgent()

        client.start({
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
        // TODO(bh, 2023-05-05): we actually still want this robot to show up in the not available list
        removeCachedUsbRobot()

        client.start({
          healthPollInterval: FAST_POLL_INTERVAL_MS,
          manualAddresses: [],
        })
        break
      }
    }
  }

  function handleRobots(): void {
    const robots = client.getRobots()

    if (!disableCache) store.set('robots', robots)

    dispatch({
      type: 'discovery:UPDATE_LIST',
      payload: { robots },
    })
  }

  function clearCache(): void {
    client.start({ initialRobots: [], manualAddresses: [] })
  }
}
