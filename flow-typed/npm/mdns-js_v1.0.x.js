// flow-typed signature: 41a424ad7c0d0083d9498f60975cb2db
// flow-typed version: <<STUB>>/mdns-js_v1.0.1/flow_v0.76.0

declare module 'mdns-js' {
  declare class mdns$Browser extends events$EventEmitter {
    discover(): void;
    stop(): void;
    networking: {
      connections: Array<NetworkConnection>,
      ...
    };
    connections: {
      services?: {
        [typeString: string]: {
          type: MdnsServiceType,
          addresses: Array<string>,
          ...
        },
        ...
      },
      addresses?: {
        [ip: string]: {
          address: string,
          port: number,
          host: string,
          txt: Array<string>,
          ...
        },
        ...
      },
      ...
    };
  }

  declare class mdns$ServiceType {
    name: string;
    protocol: string;
    subtypes: Array<string>;
    description?: string;
  }

  declare module.exports: {
    createBrowser: (serviceType: MdnsServiceType) => Browser,
    tcp: (type: string) => MdnsServiceType,
    ServiceType: any,
    ...
  }

  declare type Browser = mdns$Browser

  declare type MdnsServiceType = mdns$ServiceType

  declare type BrowserService = {
    addresses: Array<string>,
    query: Array<string>,
    type?: Array<MdnsServiceType>,
    txt?: Array<string>,
    port?: number,
    fullname?: string,
    host?: string,
    interfaceIndex: number,
    networkInterface: string,
    ...
  }

  declare type NetworkConnection = {
    interfaceIndex: number,
    networkInterface: string,
    ...
  }
}
