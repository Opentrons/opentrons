import Mdns from 'mdns-js'
import { when } from 'jest-when'

import { mockBaseBrowser, mockBrowserService } from '../__fixtures__'
import { getIPv4Interfaces, compareInterfaces } from '../interfaces'
import { createMdnsBrowser } from '..'

jest.mock('../interfaces')

jest.mock('mdns-js', () => ({
  tcp: (name: string) => ({
    name,
    protocol: 'tcp',
    subtypes: [],
    description: '',
  }),
  createBrowser: jest.fn(),
  ServiceType: function () {},
}))

const createBrowser = Mdns.createBrowser as jest.MockedFunction<
  typeof Mdns.createBrowser
>

describe('mdns browser', () => {
  const onService = jest.fn()

  beforeEach(() => {
    createBrowser.mockReturnValue(mockBaseBrowser)
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.resetAllMocks()
    mockBaseBrowser.removeAllListeners()
  })

  it('creates mdns browser that searches for http', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    mockBaseBrowser.emit('ready')

    expect(createBrowser).toHaveBeenCalledWith(Mdns.tcp('http'))
    expect(mockBaseBrowser.discover).toHaveBeenCalled()
  })

  it('does not search for anything until start is called', () => {
    createMdnsBrowser({ onService, ports: [31950] })

    expect(createBrowser).toHaveBeenCalledTimes(0)
    expect(mockBaseBrowser.discover).toHaveBeenCalledTimes(0)
  })

  it('does not search for anything until base mdns browser is ready', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()

    expect(createBrowser).toHaveBeenCalledWith(Mdns.tcp('http'))
    expect(mockBaseBrowser.discover).toHaveBeenCalledTimes(0)
  })

  it('can stop the browser', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    mockBaseBrowser.emit('ready')
    browser.stop()

    expect(mockBaseBrowser.stop).toHaveBeenCalled()
  })

  it('can restart the browser', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    mockBaseBrowser.emit('ready')

    expect(createBrowser).toHaveBeenCalledTimes(1)
    expect(mockBaseBrowser.discover).toHaveBeenCalledTimes(1)
    expect(mockBaseBrowser.stop).toHaveBeenCalledTimes(0)

    browser.start()
    mockBaseBrowser.emit('ready')

    expect(createBrowser).toHaveBeenCalledTimes(2)
    expect(mockBaseBrowser.discover).toHaveBeenCalledTimes(2)
    expect(mockBaseBrowser.stop).toHaveBeenCalledTimes(1)
  })

  it('calls onService when a service is emitted', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    mockBaseBrowser.emit('ready')
    mockBaseBrowser.emit('update', mockBrowserService)

    expect(onService).toHaveBeenCalledWith({
      name: 'opentrons-dev',
      ip: '192.168.1.42',
      port: 31950,
    })
  })

  it('ignores advertisements without names', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    mockBaseBrowser.emit('ready')
    mockBaseBrowser.emit('update', {
      ...mockBrowserService,
      fullname: undefined,
    })

    expect(onService).toHaveBeenCalledTimes(0)
  })

  it('ignores advertisements without ports', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    mockBaseBrowser.emit('ready')
    mockBaseBrowser.emit('update', { ...mockBrowserService, port: undefined })

    expect(onService).toHaveBeenCalledTimes(0)
  })

  it('ignores advertisements without addresses', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    mockBaseBrowser.emit('ready')
    mockBaseBrowser.emit('update', { ...mockBrowserService, addresses: [] })

    expect(onService).toHaveBeenCalledTimes(0)
  })

  it('prefers IPv4 addresses', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })
    const addresses = ['fe80::caf4:6db4:4652:e975', '192.168.1.42']

    browser.start()
    mockBaseBrowser.emit('ready')
    mockBaseBrowser.emit('update', { ...mockBrowserService, addresses })

    expect(onService).toHaveBeenCalledWith({
      name: 'opentrons-dev',
      ip: '192.168.1.42',
      port: 31950,
    })
  })

  it('can filter based on ports', () => {
    const browser = createMdnsBrowser({ onService, ports: [12345] })

    browser.start()
    mockBaseBrowser.emit('ready')
    mockBaseBrowser.emit('update', { ...mockBrowserService })
    mockBaseBrowser.emit('update', { ...mockBrowserService, port: 12345 })

    expect(onService).toHaveBeenCalledTimes(1)
    expect(onService).toHaveBeenCalledWith({
      name: 'opentrons-dev',
      ip: '192.168.1.42',
      port: 12345,
    })
  })

  it('checks that the mDNS browser is bound to network interfaces on an interval', () => {
    const browser = createMdnsBrowser({ onService, ports: [12345] })

    browser.start()
    mockBaseBrowser.emit('ready')

    // return new interfaces on the third poll
    when(getIPv4Interfaces as jest.MockedFunction<typeof getIPv4Interfaces>)
      .calledWith()
      .mockReturnValueOnce([])
      .mockReturnValueOnce([])
      .mockReturnValue(['en0'])

    when(compareInterfaces as jest.MockedFunction<typeof compareInterfaces>)
      .calledWith(mockBaseBrowser, [])
      .mockReturnValue({ interfacesMatch: true, extra: [], missing: [] })
      .calledWith(mockBaseBrowser, ['en0'])
      .mockReturnValue({ interfacesMatch: false, extra: [], missing: [] })

    // initial discovery
    expect(mockBaseBrowser.discover).toHaveBeenCalledTimes(1)

    // one poll after ten seconds, no need to refresh
    jest.advanceTimersByTime(10000)
    mockBaseBrowser.emit('ready')
    expect(mockBaseBrowser.discover).toHaveBeenCalledTimes(1)

    // another poll after ten seconds, no need to refresh
    jest.advanceTimersByTime(10000)
    mockBaseBrowser.emit('ready')
    expect(mockBaseBrowser.discover).toHaveBeenCalledTimes(1)

    // another poll after ten seconds, new interfaces come in
    jest.advanceTimersByTime(10001)
    mockBaseBrowser.emit('ready')
    expect(mockBaseBrowser.discover).toHaveBeenCalledTimes(2)
  })
})
