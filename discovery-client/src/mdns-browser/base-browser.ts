import { createBrowser, tcp, ServiceType } from 'mdns-js'

import type {
  Browser as BaseBrowser,
  BrowserService as BaseBrowserService,
} from 'mdns-js'

export type { BaseBrowser, BaseBrowserService }

let mdnsLibraryPatched = false

/**
 * The `ServiceType` class in mdns-js can throw in an un-catchable way when
 * it receives certain types of advertisements that happen in real life. This
 * function patches the ServiceType prototype to catch the throws
 * https://github.com/mdns-js/node-mdns-js/issues/82
 */
function patchMdnsLibrary(): void {
  if (!mdnsLibraryPatched) {
    // this method can throw (without emitting), so we need to patch this up
    const originalServiceTypeFromString = ServiceType.prototype.fromString

    ServiceType.prototype.fromString = function (...args) {
      try {
        originalServiceTypeFromString.apply(this, args)
      } catch (error) {
        console.warn(error)
      }
    }

    mdnsLibraryPatched = true
  }
}

export function createBaseBrowser(): BaseBrowser {
  patchMdnsLibrary()
  return createBrowser(tcp('http'))
}
