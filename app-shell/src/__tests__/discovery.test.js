// tests for the app-shell's discovery module
import EventEmitter from 'events'
import { app } from 'electron'
import Store from 'electron-store'
import noop from 'lodash/noop'

import { createDiscoveryClient } from '@opentrons/discovery-client'
import { startDiscovery, finishDiscovery } from '@opentrons/app/src/discovery'
import { registerDiscovery } from '../discovery'
import { getConfig, getOverrides, handleConfigChange } from '../config'
import { createNetworkInterfaceMonitor } from '../system-info'

jest.mock('electron')
jest.mock('electron-store')
jest.mock('@opentrons/discovery-client')
jest.mock('../log')
jest.mock('../config')
jest.mock('../system-info')

describe('app-shell/discovery', () => {
  let dispatch
  let mockClient

  beforeEach(() => {
    mockClient = Object.assign(new EventEmitter(), {
      services: [],
      candidates: [],
      start: jest.fn().mockReturnThis(),
      stop: jest.fn().mockReturnThis(),
      add: jest.fn().mockReturnThis(),
      remove: jest.fn().mockReturnThis(),
      setPollInterval: jest.fn().mockReturnThis(),
    })

    getConfig.mockReturnValue({ enabled: true, candidates: [] })
    getOverrides.mockReturnValue({})
    createNetworkInterfaceMonitor.mockReturnValue({ stop: noop })

    dispatch = jest.fn()
    createDiscoveryClient.mockReturnValue(mockClient)
    Store.__mockReset()
    Store.__store.get.mockImplementation(key => {
      if (key === 'services') return []
      return null
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('registerDiscovery creates a DiscoveryClient', () => {
    registerDiscovery(dispatch)

    expect(createDiscoveryClient).toHaveBeenCalledWith(
      expect.objectContaining({
        pollInterval: expect.any(Number),
        // support for legacy IPv6 wired robots
        candidates: ['[fd00:0:cafe:fefe::1]'],
        services: [],
      })
    )
  })

  it('calls client.start on discovery registration', () => {
    registerDiscovery(dispatch)
    expect(mockClient.start).toHaveBeenCalledTimes(1)
  })

  it('calls client.stop when electron app emits "will-quit"', () => {
    expect(app.once).toHaveBeenCalledTimes(0)

    registerDiscovery(dispatch)

    expect(mockClient.stop).toHaveBeenCalledTimes(0)
    expect(app.once).toHaveBeenCalledTimes(1)

    const [event, handler] = app.once.mock.calls[0]
    expect(event).toEqual('will-quit')

    // trigger event handler
    handler()
    expect(mockClient.stop).toHaveBeenCalledTimes(1)
  })

  it('sets poll speed on "discovery:START" and "discovery:FINISH"', () => {
    const handleAction = registerDiscovery(dispatch)

    handleAction({ type: 'discovery:START' })
    expect(mockClient.setPollInterval).toHaveBeenLastCalledWith(
      expect.any(Number)
    )
    handleAction({ type: 'discovery:FINISH' })
    expect(mockClient.setPollInterval).toHaveBeenLastCalledWith(
      expect.any(Number)
    )

    expect(mockClient.setPollInterval).toHaveBeenCalledTimes(2)
    const fastPoll = mockClient.setPollInterval.mock.calls[0][0]
    const slowPoll = mockClient.setPollInterval.mock.calls[1][0]
    expect(fastPoll).toBeLessThan(slowPoll)
  })

  it('sets poll speed on "shell:UI_INTIALIZED"', () => {
    const handleAction = registerDiscovery(dispatch)

    handleAction({ type: 'discovery:START' })
    expect(mockClient.setPollInterval).toHaveBeenLastCalledWith(
      expect.any(Number)
    )
    handleAction({ type: 'shell:UI_INITIALIZED' })
    expect(mockClient.setPollInterval).toHaveBeenLastCalledWith(
      expect.any(Number)
    )

    expect(mockClient.setPollInterval).toHaveBeenCalledTimes(2)
    const startPollSpeed = mockClient.setPollInterval.mock.calls[0][0]
    const uiInitializedPollSpeed = mockClient.setPollInterval.mock.calls[1][0]
    expect(startPollSpeed).toEqual(uiInitializedPollSpeed)
  })

  it('always sends "discovery:UPDATE_LIST" on "discovery:START"', () => {
    const expected = [
      { name: 'opentrons-dev', ip: '192.168.1.42', port: 31950, ok: true },
    ]

    mockClient.services = expected
    registerDiscovery(dispatch)({ type: 'discovery:START' })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'discovery:UPDATE_LIST',
      payload: { robots: expected },
    })
  })

  describe('"service" event handling', () => {
    beforeEach(() => registerDiscovery(dispatch))

    const SPECS = [
      {
        name: 'dispatches discovery:UPDATE_LIST on "service" event',
        services: [
          { name: 'opentrons-dev', ip: '192.168.1.42', port: 31950, ok: true },
        ],
      },
    ]

    SPECS.forEach(spec =>
      it(spec.name, () => {
        mockClient.services = spec.services

        mockClient.emit('service')
        expect(dispatch).toHaveBeenCalledWith({
          type: 'discovery:UPDATE_LIST',
          payload: { robots: spec.services },
        })
      })
    )
  })

  it('stores services to file on service events', () => {
    registerDiscovery(dispatch)
    expect(Store).toHaveBeenCalledWith({
      name: 'discovery',
      defaults: { services: [] },
    })

    mockClient.services = [{ name: 'foo' }, { name: 'bar' }]
    mockClient.emit('service')
    expect(Store.__store.set).toHaveBeenLastCalledWith('services', [
      { name: 'foo' },
      { name: 'bar' },
    ])
  })

  it('stores services to file on serviceRemoved events', () => {
    registerDiscovery(dispatch)

    mockClient.services = [{ name: 'foo' }]
    mockClient.emit('serviceRemoved')
    expect(Store.__store.set).toHaveBeenLastCalledWith('services', [
      { name: 'foo' },
    ])
  })

  it('loads services from file on client initialization', () => {
    Store.__store.get.mockImplementation(key => {
      if (key === 'services') return [{ name: 'foo' }]
      return null
    })

    registerDiscovery(dispatch)
    expect(createDiscoveryClient).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [{ name: 'foo' }],
      })
    )
  })

  it('loads candidates from config on client initialization', () => {
    getConfig.mockReturnValue({ enabled: true, candidates: ['1.2.3.4'] })
    registerDiscovery(dispatch)

    expect(createDiscoveryClient).toHaveBeenCalledWith(
      expect.objectContaining({
        candidates: expect.arrayContaining(['1.2.3.4']),
      })
    )
  })

  // ensures config override works with only one candidate specified
  it('candidates in config can be single value', () => {
    getConfig.mockReturnValue({ enabled: true, candidates: '1.2.3.4' })
    registerDiscovery(dispatch)

    expect(createDiscoveryClient).toHaveBeenCalledWith(
      expect.objectContaining({
        candidates: expect.arrayContaining(['1.2.3.4']),
      })
    )
  })

  it('services from overridden candidates are not persisted', () => {
    getConfig.mockReturnValue({ enabled: true, candidates: 'localhost' })
    getOverrides.mockImplementation(key => {
      if (key === 'discovery.candidates') return ['1.2.3.4', '5.6.7.8']
      return null
    })

    registerDiscovery(dispatch)

    mockClient.services = [{ name: 'foo', ip: '5.6.7.8' }, { name: 'bar' }]
    mockClient.emit('service')
    expect(Store.__store.set).toHaveBeenCalledWith('services', [
      { name: 'bar' },
    ])
  })

  it('service from overridden single candidate is not persisted', () => {
    getConfig.mockReturnValue({ enabled: true, candidates: 'localhost' })
    getOverrides.mockImplementation(key => {
      if (key === 'discovery.candidates') return '1.2.3.4'
      return null
    })

    registerDiscovery(dispatch)

    mockClient.services = [{ name: 'foo', ip: '1.2.3.4' }, { name: 'bar' }]
    mockClient.emit('service')
    expect(Store.__store.set).toHaveBeenCalledWith('services', [
      { name: 'bar' },
    ])
  })

  it('calls client.remove on discovery:REMOVE', () => {
    const handleAction = registerDiscovery(dispatch)
    handleAction({
      type: 'discovery:REMOVE',
      payload: { robotName: 'robot-name' },
    })

    expect(mockClient.remove).toHaveBeenCalledWith('robot-name')
  })

  it('deletes cached robots', () => {
    const handleAction = registerDiscovery(dispatch)
    mockClient.start.mockClear()
    mockClient.services = [{ name: 'foo', ip: '5.6.7.8' }, { name: 'bar' }]
    handleAction({
      type: 'discovery:CLEAR_CACHE',
      meta: { shell: true },
    })

    expect(mockClient.stop).toHaveBeenCalled()
    expect(mockClient.services).toEqual([])
    expect(mockClient.start).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({
      type: 'discovery:UPDATE_LIST',
      payload: { robots: [] },
    })
  })

  it('does not update services from store when caching disabled', () => {
    // cache has been disabled
    getConfig.mockReturnValue({
      candidates: [],
      disableCache: true,
    })
    // discovery.json contains 1 entry
    Store.__store.get.mockImplementation(key => {
      if (key === 'services') return [{ name: 'foo' }]
      return null
    })

    registerDiscovery(dispatch)

    // should not contain above entry
    expect(createDiscoveryClient).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [],
      })
    )
  })

  it('clears cache & suspends caching when caching changes to disabled', () => {
    // Cache enabled initially
    getConfig.mockReturnValue({
      candidates: [],
      disableCache: false,
    })
    // discovery.json contains 1 entry
    Store.__store.get.mockImplementation(key => {
      if (key === 'services') return [{ name: 'foo' }]
      return null
    })

    registerDiscovery(dispatch)

    // the 'discovery.disableCache' change handler
    const changeHandler = handleConfigChange.mock.calls[1][1]
    const disableCache = true
    changeHandler(disableCache)

    expect(Store.__store.set).toHaveBeenCalledWith('services', [])

    // new services discovered
    mockClient.services = [{ name: 'foo' }, { name: 'bar' }]
    mockClient.emit('service')

    // but discovery.json should not update
    expect(Store.__store.set).toHaveBeenLastCalledWith('services', [])
  })

  // TODO(mc, 2020-06-16): move this functionality into discovery-client
  describe('network interface monitoring', () => {
    const stopMonitor = jest.fn()
    let interfacePollInterval
    let handleInterfaceChange
    let handleAction

    beforeEach(() => {
      createNetworkInterfaceMonitor.mockImplementation(options => {
        const { pollInterval, onInterfaceChange } = options
        interfacePollInterval = pollInterval
        handleInterfaceChange = onInterfaceChange
        return { stop: stopMonitor }
      })

      handleAction = registerDiscovery(dispatch)
    })

    it('should create a network interface monitor', () => {
      expect(interfacePollInterval).toBe(30000)
      expect(typeof handleInterfaceChange).toBe('function')
    })

    it('should restart the mdns browser when interfaces change', () => {
      expect(mockClient.start).toHaveBeenCalledTimes(1)
      handleInterfaceChange([])
      expect(mockClient.start).toHaveBeenCalledTimes(2)
    })

    it('calls stops the interface monitor when electron app emits "will-quit"', () => {
      const [event, handler] = app.once.mock.calls[0]
      expect(event).toEqual('will-quit')

      // trigger event handler
      expect(stopMonitor).toHaveBeenCalledTimes(0)
      handler()
      expect(stopMonitor).toHaveBeenCalledTimes(1)
    })

    it('should speed up the network interface monitor in fast discovery mode', () => {
      expect(stopMonitor).toHaveBeenCalledTimes(0)
      expect(createNetworkInterfaceMonitor).toHaveBeenCalledTimes(1)

      handleAction(startDiscovery())
      expect(stopMonitor).toHaveBeenCalledTimes(1)
      expect(createNetworkInterfaceMonitor).toHaveBeenCalledTimes(2)

      expect(interfacePollInterval).toBe(5000)
    })

    it('should slow the network interface monitor down once discovery ends', () => {
      handleAction(startDiscovery())
      handleAction(finishDiscovery())
      expect(stopMonitor).toHaveBeenCalledTimes(2)
      expect(createNetworkInterfaceMonitor).toHaveBeenCalledTimes(3)

      expect(interfacePollInterval).toBe(30000)
    })
  })
})
