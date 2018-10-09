// @flow
// mdns browser wrapper
import mdns, {ServiceType} from 'mdns-js'
import type {Browser} from 'mdns-js'
import keys from 'lodash/keys'
import flatMap from 'lodash/flatMap'

monkeyPatchThrowers()

export default function MdnsBrowser (): Browser {
  return mdns.createBrowser(mdns.tcp('http'))
}

export function getKnownIps (maybeBrowser: ?Browser): Array<string> {
  if (!maybeBrowser) return []
  const browser: Browser = maybeBrowser

  // $FlowFixMe: https://github.com/flow-typed/flow-typed/issues/2463
  return flatMap(browser.networking.connections, connection => {
    const {addresses} = browser.connections[connection.networkInterface] || {}
    return keys(addresses)
  })
}

function monkeyPatchThrowers () {
  // this method can throw (without emitting), so we need to patch this up
  const originalServiceTypeFromString = ServiceType.prototype.fromString

  ServiceType.prototype.fromString = function (...args) {
    try {
      originalServiceTypeFromString.apply(this, args)
    } catch (error) {
      console.warn(error)
    }
  }
}
