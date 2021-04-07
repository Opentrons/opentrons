import { networkInterfaces } from 'os'

import type { Browser as BaseBrowser } from 'mdns-js'

export interface CompareInterfacesResult {
  interfacesMatch: boolean
  missing: string[]
  extra: string[]
}

export function getIPv4Interfaces(): string[] {
  const interfaceMap = networkInterfaces()

  return Object.keys(interfaceMap).filter(ifaceName =>
    interfaceMap[ifaceName].some(
      iface => !iface.internal && iface.family === 'IPv4'
    )
  )
}

export function compareInterfaces(
  browser: BaseBrowser,
  systemInterfaces: string[]
): CompareInterfacesResult {
  const browserInterfaces = browser.networking.connections
    .map(connection => connection.networkInterface)
    .filter(interfaceName => interfaceName !== 'pseudo multicast')

  const extra = browserInterfaces.filter(
    iface => !systemInterfaces.includes(iface)
  )
  const missing = systemInterfaces.filter(
    iface => !browserInterfaces.includes(iface)
  )
  const interfacesMatch = extra.length === 0 && missing.length === 0

  return { interfacesMatch, missing, extra }
}
