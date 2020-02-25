// @flow
import type { BrowserService, MdnsServiceType } from 'mdns-js'

export const MOCK_BROWSER_SERVICE: BrowserService = {
  addresses: ['192.168.1.42'],
  query: ['_http._tcp.local'],
  type: [
    (({
      name: 'http',
      protocol: 'tcp',
      subtypes: [],
      description: 'Web Site',
    }: any): MdnsServiceType),
  ],
  txt: [''],
  port: 31950,
  fullname: 'opentrons-dev._http._tcp.local',
  host: 'opentrons-dev.local',
  interfaceIndex: 0,
  networkInterface: 'en0',
}
