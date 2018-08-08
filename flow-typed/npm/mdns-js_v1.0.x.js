// flow-typed signature: 41a424ad7c0d0083d9498f60975cb2db
// flow-typed version: <<STUB>>/mdns-js_v1.0.1/flow_v0.76.0

import EventEmitter from 'events'

declare module 'mdns-js' {
  declare class mdns$Browser extends EventEmitter {
    discover(): void;
    stop(): void;
  }

  declare class mdns$ServiceType {
    name: string;
    protocol: string;
    subtypes: Array<string>;
    description: string;
  }

  declare module.exports: {
    createBrowser: (serviceType: ServiceType) => Browser,
    tcp: (type: string) => ServiceType
  }

  declare type Browser = mdns$Browser

  declare type ServiceType = mdns$ServiceType

  declare type BrowserService = {
    addresses: Array<string>,
    query: Array<string>,
    type: Array<ServiceType>,
    txt: Array<string>,
    port: number,
    fullname: string,
    host: string,
    interfaceIndex: number,
    networkInterface: string
  }
}
