import EventEmitter from 'events'

declare module 'bonjour' {
  declare type BonjourOpts = {}

  declare type PublishOpts = {}

  declare type FindOpts = {
    type?: ?string,
    subtypes?: ?Array<string>,
    protocol?: ?('tcp' | 'udp'),
    txt?: ?{},
  }

  declare type BrowserService = {
    addresses: Array<string>,
    name: string,
    fqdn: string,
    host: string,
    referer: {
      address: string,
      family: string,
      port: number,
      size: number,
    },
    port: number,
    type: 'http' | 'local',
    protocol: 'tcp' | 'udp',
    subtypes: Array<string>
  }

  declare class bonjour$Browser extends EventEmitter {
    start(): void,
    stop(): void,
    update(): void,
  }

  declare class bonjour$Bonjour {
    constructor(opts?: BonjourOpts): Bonjour,
    publish(opts: PublishOpts): any,
    unpublishAll(cb?: () => mixed): any,
    find(opts: FindOpts, onup?: (BrowserService) => mixed): Browser,
    findOne(opts: FindOpts, cb?: (BrowserService) => mixed): Browser,
    destroy(): void,
  }

  declare type Browser = Class<bonjour$Browser>

  declare type Bonjour = Class<bonjour$Bonjour>

  declare module.exports: Bonjour & (opts?: BonjourOpts) => bonjour$Bonjour
}
