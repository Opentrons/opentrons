// mdns browser wrapper
import net from 'net'
import { createBaseBrowser } from './base-browser'
import { repeatCall } from './repeat-call'

import * as Ifaces from './interfaces'

import type { LogLevel } from '../types'
import type {
  MdnsBrowser,
  MdnsBrowserOptions,
  MdnsBrowserService,
} from './types'
import type { BaseBrowser, BaseBrowserService } from './base-browser'
import type { RepeatCallResult } from './repeat-call'

export type { MdnsBrowser, MdnsBrowserOptions, MdnsBrowserService }

const IFACE_POLL_INTERVAL_MS = 5000
const QUERY_INTERVAL_MS = [4000, 8000, 16000, 32000, 64000, 128000]

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
  let ifacePollTask: RepeatCallResult | null = null
  let queryTask: RepeatCallResult | null = null

  function start(): void {
    stop()

    log('debug', 'Creating _http._tcp mDNS browser', { ports })

    const baseBrowser = createBaseBrowser()

    baseBrowser
      .once('ready', () => {
        queryTask = repeatCall({
          handler: queryMdns,
          interval: QUERY_INTERVAL_MS,
          callImmediately: true,
        })

        ifacePollTask = repeatCall({
          handler: pollNetworkInterfaces,
          interval: IFACE_POLL_INTERVAL_MS,
        })
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
    if (ifacePollTask !== null) {
      ifacePollTask.cancel()
      ifacePollTask = null
    }

    if (queryTask !== null) {
      queryTask.cancel()
      queryTask = null
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

  function queryMdns(): void {
    if (browser !== null) {
      log('debug', 'Sending mDNS discovery query')
      browser.discover()
    }
  }

  function pollNetworkInterfaces(): void {
    if (browser !== null) {
      log('silly', 'Checking network interfaces for changes')

      const { interfacesMatch, extra, missing } = Ifaces.compareInterfaces(
        Ifaces.getBrowserInterfaces(browser),
        Ifaces.getSystemInterfaces()
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
