// @flow
import EventEmitter from 'events'
import Mdns from 'mdns-js'

import { mockBrowserService } from '../__fixtures__'
import { createMdnsBrowser } from '../mdns-browser'

import type { MdnsServiceType, Browser } from 'mdns-js'

jest.mock('mdns-js', () => ({
  tcp: (name: string) => ({
    name,
    protocol: 'tcp',
    subtypes: [],
    description: '',
  }),
  createBrowser: jest.fn(),
  ServiceType: function() {},
}))

const createBrowser: JestMockFn<[MdnsServiceType], Browser> = Mdns.createBrowser

const baseBrowser: Browser = (Object.assign(
  new EventEmitter(),
  ({ discover: jest.fn(), stop: jest.fn() }: any)
): any)

describe('mdns browser', () => {
  const onService = jest.fn()

  beforeEach(() => {
    createBrowser.mockReturnValue(baseBrowser)
  })

  afterEach(() => {
    jest.resetAllMocks()
    baseBrowser.removeAllListeners()
  })

  it('creates mdns browser that searches for http', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    baseBrowser.emit('ready')

    expect(createBrowser).toHaveBeenCalledWith(Mdns.tcp('http'))
    expect(baseBrowser.discover).toHaveBeenCalled()
  })

  it('does not search for anything until start is called', () => {
    createMdnsBrowser({ onService, ports: [31950] })

    expect(createBrowser).toHaveBeenCalledTimes(0)
    expect(baseBrowser.discover).toHaveBeenCalledTimes(0)
  })

  it('does not search for anything until base mdns browser is ready', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()

    expect(createBrowser).toHaveBeenCalledWith(Mdns.tcp('http'))
    expect(baseBrowser.discover).toHaveBeenCalledTimes(0)
  })

  it('can stop the browser', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    baseBrowser.emit('ready')
    browser.stop()

    expect(baseBrowser.stop).toHaveBeenCalled()
  })

  it('can restart the browser', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    baseBrowser.emit('ready')

    expect(createBrowser).toHaveBeenCalledTimes(1)
    expect(baseBrowser.discover).toHaveBeenCalledTimes(1)
    expect(baseBrowser.stop).toHaveBeenCalledTimes(0)

    browser.start()
    baseBrowser.emit('ready')

    expect(createBrowser).toHaveBeenCalledTimes(2)
    expect(baseBrowser.discover).toHaveBeenCalledTimes(2)
    expect(baseBrowser.stop).toHaveBeenCalledTimes(1)
  })

  it('calls onService when a service is emitted', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    baseBrowser.emit('ready')
    baseBrowser.emit('update', mockBrowserService)

    expect(onService).toHaveBeenCalledWith({
      name: 'opentrons-dev',
      ip: '192.168.1.42',
      port: 31950,
    })
  })

  it('ignores advertisements without names', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    baseBrowser.emit('ready')
    baseBrowser.emit('update', { ...mockBrowserService, fullname: undefined })

    expect(onService).toHaveBeenCalledTimes(0)
  })

  it('ignores advertisements without ports', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    baseBrowser.emit('ready')
    baseBrowser.emit('update', { ...mockBrowserService, port: undefined })

    expect(onService).toHaveBeenCalledTimes(0)
  })

  it('ignores advertisements without addresses', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    baseBrowser.emit('ready')
    baseBrowser.emit('update', { ...mockBrowserService, addresses: [] })

    expect(onService).toHaveBeenCalledTimes(0)
  })

  it('prefers IPv4 addresses', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })
    const addresses = ['fe80::caf4:6db4:4652:e975', '192.168.1.42']

    browser.start()
    baseBrowser.emit('ready')
    baseBrowser.emit('update', { ...mockBrowserService, addresses })

    expect(onService).toHaveBeenCalledWith({
      name: 'opentrons-dev',
      ip: '192.168.1.42',
      port: 31950,
    })
  })

  it('can filter based on ports', () => {
    const browser = createMdnsBrowser({ onService, ports: [12345] })

    browser.start()
    baseBrowser.emit('ready')
    baseBrowser.emit('update', { ...mockBrowserService })
    baseBrowser.emit('update', { ...mockBrowserService, port: 12345 })

    expect(onService).toHaveBeenCalledTimes(1)
    expect(onService).toHaveBeenCalledWith({
      name: 'opentrons-dev',
      ip: '192.168.1.42',
      port: 12345,
    })
  })
})
