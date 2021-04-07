// mdns browser wrapper
import net from 'net'
import { createBaseBrowser } from './base-browser'
import { getIPv4Interfaces, compareInterfaces } from './interfaces'

import type { LogLevel } from '../types'
import type {
  MdnsBrowser,
  MdnsBrowserOptions,
  MdnsBrowserService,
} from './types'
import type { BaseBrowser, BaseBrowserService } from './base-browser'

export type { MdnsBrowser, MdnsBrowserOptions, MdnsBrowserService }

const IFACE_POLL_INTERVAL_MS = 10000

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
  let ifacePollIntervalId: NodeJS.Timeout | null = null

  function start(): void {
    stop()

    log('debug', 'Creating _http._tcp mDNS browser', { ports })

    const baseBrowser = createBaseBrowser()

    baseBrowser
      .once('ready', () => {
        baseBrowser.discover()
        ifacePollIntervalId = setInterval(
          pollNetworkInterfaces,
          IFACE_POLL_INTERVAL_MS
        )
      })
      .on('update', (service: BaseBrowserService) => {
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
    if (ifacePollIntervalId !== null) {
      clearInterval(ifacePollIntervalId)
    }

    if (browser !== null) {
      log('debug', 'Stopping mDNS browser')
      browser.stop()
      browser.removeAllListeners('ready')
      browser.removeAllListeners('update')
      browser.removeAllListeners('error')
      browser = null
    }
  }

  function pollNetworkInterfaces(): void {
    if (browser !== null) {
      const interfaces = getIPv4Interfaces()
      const { interfacesMatch, extra, missing } = compareInterfaces(
        browser,
        interfaces
      )

      if (!interfacesMatch) {
        logger?.debug('Restarting mDNS due to network interface mismatch', {
          extra,
          missing,
        })
        start()
      }
    }
  }

  return { start, stop }
}
