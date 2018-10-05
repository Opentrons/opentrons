// @flow
// mdns browser wrapper
import mdns, {ServiceType} from 'mdns-js'
import type {Browser} from 'mdns-js'

monkeyPatchThrowers()

export default function MdnsBrowser (): Browser {
  return mdns.createBrowser(mdns.tcp('http'))
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
