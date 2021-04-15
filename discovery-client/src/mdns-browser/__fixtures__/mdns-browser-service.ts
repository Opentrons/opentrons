import EventEmitter from 'events'

import type { Browser, BrowserService, ServiceType } from 'mdns-js'

export const mockBaseBrowser: Browser = Object.assign(new EventEmitter(), {
  discover: jest.fn(),
  stop: jest.fn(),
  networking: { connections: [] },
  connections: {},
})

export const mockBrowserService: BrowserService = {
  addresses: ['192.168.1.42'],
  query: ['_http._tcp.local'],
  type: [
    ({
      name: 'http',
      protocol: 'tcp',
      subtypes: [],
      description: 'Web Site',
    } as unknown) as ServiceType,
  ],
  txt: [''],
  port: 31950,
  fullname: 'opentrons-dev._http._tcp.local',
  host: 'opentrons-dev.local',
  interfaceIndex: 0,
  networkInterface: 'en0',
}
