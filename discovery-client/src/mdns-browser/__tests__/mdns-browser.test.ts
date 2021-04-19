import Mdns from 'mdns-js'
import { when } from 'jest-when'
import { isEqual } from 'lodash'

import { mockBaseBrowser, mockBrowserService } from '../__fixtures__'
import * as Ifaces from '../interfaces'
import { repeatCall as mockRepeatCall } from '../repeat-call'
import { createMdnsBrowser } from '..'

jest.mock('../interfaces')
jest.mock('../repeat-call')

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

const getBrowserInterfaces = Ifaces.getBrowserInterfaces as jest.MockedFunction<
  typeof Ifaces.getBrowserInterfaces
>

const getSystemInterfaces = Ifaces.getSystemInterfaces as jest.MockedFunction<
  typeof Ifaces.getSystemInterfaces
>

const compareInterfaces = Ifaces.compareInterfaces as jest.MockedFunction<
  typeof Ifaces.compareInterfaces
>

const repeatCall = mockRepeatCall as jest.MockedFunction<typeof mockRepeatCall>

describe('mdns browser', () => {
  const onService = jest.fn()

  beforeEach(() => {
    createBrowser.mockReturnValue(mockBaseBrowser)
    repeatCall.mockReturnValue({ cancel: jest.fn() })
  })

  afterEach(() => {
    jest.resetAllMocks()
    mockBaseBrowser.removeAllListeners()
  })

  it('creates mdns browser that searches for http', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    mockBaseBrowser.emit('ready')

    expect(createBrowser).toHaveBeenCalledWith(Mdns.tcp('http'))
  })

  it('does not search for anything until start is called', () => {
    createMdnsBrowser({ onService, ports: [31950] })

    expect(createBrowser).toHaveBeenCalledTimes(0)
  })

  it('does not search for anything until base mdns browser is ready', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()

    expect(createBrowser).toHaveBeenCalledWith(Mdns.tcp('http'))
    expect(repeatCall).toHaveBeenCalledTimes(0)
  })

  it('requeries the mDNS browser on a backed-off interval', () => {
    let requery: () => unknown = () => {
      throw new Error('stubbed repeatCall handler not found')
    }

    repeatCall.mockImplementation(options => {
      const { handler, interval, callImmediately } = options
      if (
        isEqual(interval, [4000, 8000, 16000, 32000, 64000, 128000]) &&
        callImmediately === true
      ) {
        requery = handler
      }

      return { cancel: jest.fn() }
    })

    const browser = createMdnsBrowser({ onService, ports: [12345] })
    browser.start()
    mockBaseBrowser.emit('ready')

    // discovery is called again on requery interval
    requery()
    expect(mockBaseBrowser.discover).toHaveBeenCalledTimes(1)

    requery()
    expect(mockBaseBrowser.discover).toHaveBeenCalledTimes(2)
  })

  it('checks that the mDNS browser is bound to network interfaces on an 5 second interval', () => {
    when(
      getBrowserInterfaces as jest.MockedFunction<typeof getBrowserInterfaces>
    )
      .calledWith(mockBaseBrowser)
      .mockReturnValue([])

    // return new system interfaces on the second poll
    when(getSystemInterfaces as jest.MockedFunction<typeof getSystemInterfaces>)
      .calledWith()
      .mockReturnValueOnce([])
      .mockReturnValue([{ name: 'en1', address: '192.168.1.1' }])

    when(compareInterfaces as jest.MockedFunction<typeof compareInterfaces>)
      .calledWith([], [])
      .mockReturnValue({ interfacesMatch: true, extra: [], missing: [] })
      .calledWith([], [{ name: 'en1', address: '192.168.1.1' }])
      .mockReturnValue({
        interfacesMatch: false,
        extra: [],
        missing: [{ name: 'en1', address: '192.168.1.1' }],
      })

    let checkInterfaces: () => unknown = () => {
      throw new Error('stubbed repeatCall handler not found')
    }

    repeatCall.mockImplementation(options => {
      const { handler, interval } = options
      if (interval === 5000) checkInterfaces = handler
      return { cancel: jest.fn() }
    })

    const browser = createMdnsBrowser({ onService, ports: [12345] })
    browser.start()
    mockBaseBrowser.emit('ready')
    createBrowser.mockClear()

    // one poll no need to refresh
    checkInterfaces()
    expect(createBrowser).toHaveBeenCalledTimes(0)

    // new interfaces come in on second poll, browser should be rebuilt
    checkInterfaces()
    expect(createBrowser).toHaveBeenCalledTimes(1)
  })

  it('can stop the browser', () => {
    const cancelInterval = jest.fn()

    repeatCall.mockReturnValue({ cancel: cancelInterval })

    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    mockBaseBrowser.emit('ready')
    browser.stop()

    expect(mockBaseBrowser.stop).toHaveBeenCalled()
    expect(cancelInterval).toHaveBeenCalledTimes(2)
  })

  it('can restart the browser', () => {
    const browser = createMdnsBrowser({ onService, ports: [31950] })

    browser.start()
    mockBaseBrowser.emit('ready')

    expect(createBrowser).toHaveBeenCalledTimes(1)
    expect(mockBaseBrowser.stop).toHaveBeenCalledTimes(0)

    browser.start()
    mockBaseBrowser.emit('ready')

    expect(createBrowser).toHaveBeenCalledTimes(2)
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
})
