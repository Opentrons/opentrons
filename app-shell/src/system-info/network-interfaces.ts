import os from 'os'
import isEqual from 'lodash/isEqual'

import type { NetworkInterface } from '@opentrons/app/src/redux/system-info/types'

export type { NetworkInterface }

export interface NetworkInterfaceMonitorOptions {
  pollInterval: number
  onInterfaceChange: (ifaces: NetworkInterface[]) => unknown
}

export interface NetworkInterfaceMonitor {
  stop: () => void
}

export function getActiveInterfaces(): NetworkInterface[] {
  const ifaces = os.networkInterfaces()

  return Object.keys(ifaces).flatMap<NetworkInterface>((name: string) => {
    // @ts-expect-error(sa, 2021-6-28): this could be undefined because Object.keys returns a list of strings (too generic)
    return ifaces[name]
      .filter(iface => !iface.internal)
      .map(iface => ({ ...iface, name }))
  })
}

export function createNetworkInterfaceMonitor(
  options: NetworkInterfaceMonitorOptions
): NetworkInterfaceMonitor {
  const { pollInterval, onInterfaceChange } = options
  let ifaces = getActiveInterfaces()

  const pollId = setInterval(monitorActiveInterfaces, pollInterval)

  return { stop: () => clearInterval(pollId) }

  function monitorActiveInterfaces(): void {
    const nextIfaces = getActiveInterfaces()
    if (!isEqual(ifaces, nextIfaces)) {
      ifaces = nextIfaces
      onInterfaceChange(ifaces)
    }
  }
}
