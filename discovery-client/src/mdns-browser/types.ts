import type { Logger } from '../types'

/**
 * Relevant data from an mDNS advertisement
 */
export interface MdnsBrowserService {
  /** The service's name from the advertisement */
  name: string
  /** The IP address that the service is using */
  ip: string
  /** The port the service is using */
  port: number
}

/**
 * An mDNS browser that can be started and stopped as needed
 */
export interface MdnsBrowser {
  /** Start discovering services */
  start: () => void
  /** Stop discovering services and tear down the underlying browser */
  stop: () => void
}

/**
 * Options used to construct an mDNS browser
 */
export interface MdnsBrowserOptions {
  /** list of allowed ports; if empty, no services will be emitted */
  ports: number[]
  /** Function to call whenever a service is discovered on mDNS */
  onService: (service: MdnsBrowserService) => unknown
  /** Optional logger */
  logger?: Logger
}
