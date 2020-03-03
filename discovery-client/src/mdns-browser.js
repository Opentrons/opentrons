// @flow
// mdns browser wrapper
import mdns, { ServiceType } from 'mdns-js'
import type { Browser, NetworkConnection } from 'mdns-js'
import keys from 'lodash/keys'
import flatMap from 'lodash/flatMap'

monkeyPatchThrowers()

export function createMdnsBrowser(): Browser {
  return mdns.createBrowser(mdns.tcp('http'))
}

export function getKnownIps(maybeBrowser: ?Browser): Array<string> {
  if (!maybeBrowser) return []
  const browser: Browser = maybeBrowser

  return flatMap<NetworkConnection, string>(
    browser.networking.connections,
    (connection: NetworkConnection, i: number, _: Array<NetworkConnection>) => {
      const { addresses } =
        browser.connections[connection.networkInterface] || {}
      return keys(addresses)
    }
  )
}

function monkeyPatchThrowers() {
  // this method can throw (without emitting), so we need to patch this up
  const originalServiceTypeFromString = ServiceType.prototype.fromString

  ServiceType.prototype.fromString = function(...args) {
    try {
      originalServiceTypeFromString.apply(this, args)
    } catch (error) {
      console.warn(error)
    }
  }
}
