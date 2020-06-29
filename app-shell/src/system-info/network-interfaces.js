// @flow
import type { NetworkInterface } from '@opentrons/app/src/system-info/types'
import isEqual from 'lodash/isEqual'
import os from 'os'

export type { NetworkInterface }

export type NetworkInterfaceMonitorOptions = {|
  pollInterval: number,
  onInterfaceChange: (ifaces: Array<NetworkInterface>) => mixed,
|}

export type NetworkInterfaceMonitor = {|
  stop: () => void,
|}

export function getActiveInterfaces(): Array<NetworkInterface> {
  const ifaces = os.networkInterfaces()

  return Object.keys(ifaces).flatMap<NetworkInterface>((name: string) => {
    // $FlowFixMe(mc, 2020-05-27): Flow def of os.networkInterfaces return is incomplete
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

  function monitorActiveInterfaces() {
    const nextIfaces = getActiveInterfaces()
    if (!isEqual(ifaces, nextIfaces)) {
      ifaces = nextIfaces
      onInterfaceChange(ifaces)
    }
  }
}
