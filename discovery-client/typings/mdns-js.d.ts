declare module 'mdns-js' {
  import EventEmitter from 'events'
  import { Socket } from 'dgram'

  namespace mdns {
    interface BrowserService {
      addresses: string[]
      query: string[]
      type?: ServiceType[]
      txt?: string[]
      port?: number
      fullname?: string
      host?: string
      interfaceIndex: number
      networkInterface: string
    }

    interface NetworkConnection {
      interfaceIndex: number
      networkInterface: string
      socket: Socket
      counters: {
        sent: number
        received: number
      }
    }

    class ServiceType {
      name: string
      protocol: string
      subtypes: string[]
      description?: string

      fromString(text: string): void
    }

    class Browser extends EventEmitter {
      discover(): void
      stop(): void
      networking: {
        connections: NetworkConnection[]
      }

      connections: {
        services?: {
          [typeString: string]: {
            type: ServiceType
            addresses: string[]
          }
        }
        addresses?: {
          [ip: string]: {
            address: string
            port: number
            host: string
            txt: string[]
          }
        }
      }
    }

    function createBrowser(serviceType: ServiceType): Browser
    function tcp(type: string): ServiceType
  }

  export = mdns
}
