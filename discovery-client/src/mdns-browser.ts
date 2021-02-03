// mdns browser wrapper
import net from 'net'
import { createBrowser, tcp, ServiceType } from 'mdns-js'

import type { Browser as BaseBrowser, BrowserService } from 'mdns-js'
import type { MdnsBrowser, MdnsBrowserOptions, LogLevel } from './types'

monkeyPatchThrowers()

/**
 * Create a mDNS browser wrapper can be started and stopped and calls
 * `onService` when the underlying browser receives an advertisement
 */
export function createMdnsBrowser(options: MdnsBrowserOptions): MdnsBrowser {
  const { onService, ports, logger } = options
  const log = (
    level: LogLevel,
    msg: string,
    meta: Record<string, unknown> = {}
  ): void => {
    typeof logger?.[level] === 'function' && logger[level](msg, meta)
  }

  let browser: BaseBrowser | null = null

  const start = (): void => {
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
          log('silly', 'Ignoring mDNS service', { service })
        }
      })
      .on('error', (e: Error) => {
        log('error', 'Unexpected mDNS browser error', { message: e.message })
      })

    browser = baseBrowser
  }

  function stop(): void {
    if (browser !== null) {
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

/**
 * The `ServiceType` class in mdns-js can throw in an uncatchable way when
 * it receives certain types of advertisements that happen in real life. This
 * function monkeypatches the ServiceType prototype to catch the throws
 * https://github.com/mdns-js/node-mdns-js/issues/82
 */
function monkeyPatchThrowers(): void {
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
