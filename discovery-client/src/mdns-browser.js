// @flow
// mdns browser wrapper
import net from 'net'
import { createBrowser, tcp, ServiceType } from 'mdns-js'
import keys from 'lodash/keys'
import flatMap from 'lodash/flatMap'

import type {
  Browser as BaseBrowser,
  BrowserService,
  NetworkConnection,
} from 'mdns-js'

import type { MdnsBrowser, MdnsBrowserOptions, LogLevel } from './types'

monkeyPatchThrowers()

// TODO(mc, 2020-07-14): remove the function in favor of createMdnsBrowser
export function createMdnsBrowserLegacy(): BaseBrowser {
  return createBrowser(tcp('http'))
}

/**
 * Create a mDNS browser wrapper can be started and stopped and calls
 * `onService` when the underlying browser receives an advertisement
 */
export function createMdnsBrowser(options: MdnsBrowserOptions): MdnsBrowser {
  const { onService, ports, logger } = options
  const log = (level: LogLevel, msg: string, meta: {} = {}) => {
    typeof logger?.[level] === 'function' && logger[level](msg, meta)
  }

  let browser: BaseBrowser | null = null

  const start = () => {
    stop()

    log('debug', 'Creating _http._tcp mDNS browser', { ports })

    const baseBrowser = createBrowser(tcp('http'))

    baseBrowser
      .once('ready', () => baseBrowser.discover())
      .on('update', (service: BrowserService) => {
        const { fullname, addresses, port } = service
        const ip = addresses.find(address => net.isIPv4(address))

        if (
          fullname != null &&
          ip != null &&
          port != null &&
          ports.includes(port)
        ) {
          const name = fullname.replace(/\._http\._tcp.local$/, '')
          onService({ name, ip, port })
        } else {
          log('debug', 'Ignoring mDNS service', { service })
        }
      })
      .on('error', (e: Error) => {
        log('error', 'Unexpected mDNS browser error', { message: e.message })
      })

    browser = baseBrowser
  }

  const stop = () => {
    if (browser) {
      log('debug', 'Stopping mDNS browser')
      browser.stop()
      browser.removeAllListeners('ready')
      browser.removeAllListeners('update')
      browser.removeAllListeners('error')
      browser = null
    }
  }

  return { start, stop }
}

// TODO(mc, 2020-07-14): remove the function because it's part of the mDNS
// "rediscovery" logic that doesn't work well
// https://github.com/Opentrons/opentrons/issues/5985
export function getKnownIps(maybeBrowser: ?BaseBrowser): Array<string> {
  if (!maybeBrowser) return []
  const browser: BaseBrowser = maybeBrowser

  return flatMap<NetworkConnection, string>(
    browser.networking.connections,
    (connection: NetworkConnection, i: number, _: Array<NetworkConnection>) => {
      const { addresses } =
        browser.connections[connection.networkInterface] || {}
      return keys(addresses)
    }
  )
}

/**
 * The `ServiceType` class in mdns-js can throw in an uncatchable way when
 * it receives certain types of advertisements that happen in real life. This
 * function monkeypatches the ServiceType prototype to catch the throws
 * https://github.com/mdns-js/node-mdns-js/issues/82
 */
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
