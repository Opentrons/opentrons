import { networkInterfaces } from 'os'
import isEqual from 'lodash/isEqual'

import type { Browser as BaseBrowser } from 'mdns-js'

export interface NetworkInterface {
  name: string
  address: string
}

export interface CompareInterfacesResult {
  interfacesMatch: boolean
  missing: NetworkInterface[]
  extra: NetworkInterface[]
}

export function getSystemInterfaces(): NetworkInterface[] {
  const interfaceMap = networkInterfaces()

  return Object.keys(interfaceMap).flatMap(ifaceName => {
    return interfaceMap[ifaceName]
      .filter(iface => iface.family === 'IPv4' && !iface.internal)
      .map(iface => ({ name: ifaceName, address: iface.address }))
  })
}

export function getBrowserInterfaces(browser: BaseBrowser): NetworkInterface[] {
  return browser.networking.connections
    .filter(connection => connection.networkInterface !== 'pseudo multicast')
    .map(connection => {
      const address = connection.socket.address()

      return {
        name: connection.networkInterface,
        address: typeof address === 'string' ? address : address.address,
      }
    })
}

export function compareInterfaces(
  targetInterfaces: NetworkInterface[],
  compareInterfaces: NetworkInterface[]
): CompareInterfacesResult {
  const extra = targetInterfaces.filter(
    target => !compareInterfaces.some(compare => isEqual(compare, target))
  )
  const missing = compareInterfaces.filter(
    compare => !targetInterfaces.some(target => isEqual(target, compare))
  )
  const interfacesMatch = extra.length === 0 && missing.length === 0

  return { interfacesMatch, missing, extra }
}
