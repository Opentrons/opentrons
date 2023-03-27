import { buildUSBAgent } from '@opentrons/usb-bridge/node-client'

import { DEFAULT_PORT } from './constants'
import { createHealthPoller } from './health-poller'
import { createMdnsBrowser } from './mdns-browser'
import * as Store from './store'

import type { Agent } from 'http'
import type { PortInfo } from '@opentrons/usb-bridge/node-client'
import type {
  DiscoveryClient,
  DiscoveryClientConfig,
  DiscoveryClientOptions,
  Address,
  DiscoveryClientRobot,
} from './types'

export function createDiscoveryClient(
  options: DiscoveryClientOptions
): DiscoveryClient {
  const { onListChange, logger } = options
  const { getState, dispatch, subscribe } = Store.createStore()
  const getAddresses = (): Address[] => Store.getAddresses(getState())
  const getRobots = (): DiscoveryClientRobot[] => Store.getRobots(getState())
  const getSerialPorts = (): PortInfo[] => Store.getSerialPorts(getState())
  let unsubscribe: (() => void) | null = null

  const createHttpAgent = (serialPort: string): Agent =>
    buildUSBAgent({ serialPort })

  const healthPoller = createHealthPoller({
    onPollResult: result => dispatch(Store.healthPolled(result)),
    onSerialPortFetch: result => dispatch(Store.serialPortsPolled(result)),
    logger,
  })

  const mdnsBrowser = createMdnsBrowser({
    onService: service => dispatch(Store.serviceFound(service)),
    ports: [DEFAULT_PORT],
    logger,
  })

  const removeRobot = (robotName: string): void => {
    dispatch(Store.removeRobot(robotName))
  }

  const start = (config?: DiscoveryClientConfig): void => {
    const { healthPollInterval, ...intialState } = config ?? {}

    dispatch(Store.initializeState(intialState))

    let prevAddrs = getAddresses()
    let prevRobots = getRobots()
    let prevSerialPorts = getSerialPorts()

    healthPoller.start({
      list: prevAddrs,
      interval: healthPollInterval,
    })
    mdnsBrowser.start()

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!unsubscribe) {
      unsubscribe = subscribe(() => {
        const addrs = getAddresses()
        const robots = getRobots()
        const serialPorts = getSerialPorts()

        if (addrs !== prevAddrs || serialPorts !== prevSerialPorts) {
          healthPoller.start({ list: addrs })
        }
        if (robots !== prevRobots) onListChange(robots)

        prevAddrs = addrs
        prevRobots = robots
        prevSerialPorts = serialPorts
      })
    }
  }

  const stop = (): void => {
    mdnsBrowser.stop()
    healthPoller.stop()
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    createHttpAgent,
    getRobots,
    getSerialPorts,
    removeRobot,
    start,
    stop,
  }
}
