// tests for the app-shell's discovery module
import { app } from 'electron'
import Store from 'electron-store'
import { noop, last } from 'lodash'

import { createDiscoveryClient } from '@opentrons/discovery-client'
import { startDiscovery, finishDiscovery } from '@opentrons/app/src/discovery'
import { registerDiscovery } from '../discovery'
import { getFullConfig, getOverrides, handleConfigChange } from '../config'
import { createNetworkInterfaceMonitor } from '../system-info'

jest.mock('electron')
jest.mock('electron-store')
jest.mock('@opentrons/discovery-client')
jest.mock('@opentrons/app/src/getLabware')
jest.mock('../config')
jest.mock('../system-info')

describe('app-shell/discovery', () => {
  const dispatch = jest.fn()
  const mockClient = {
    start: jest.fn(),
    stop: jest.fn(),
    getRobots: jest.fn(),
    removeRobot: jest.fn(),
  }

  const emitListChange = () => {
    const lastCall = last(createDiscoveryClient.mock.calls)
    const { onListChange } = lastCall[0]
    onListChange()
  }

  beforeEach(() => {
    getFullConfig.mockReturnValue({
      discovery: { disableCache: false, candidates: [] },
    })

    getOverrides.mockReturnValue({})
    createNetworkInterfaceMonitor.mockReturnValue({ stop: noop })
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
        onListChange: expect.any(Function),
      })
    )
  })

  it('calls client.start on discovery registration', () => {
    registerDiscovery(dispatch)

    expect(mockClient.start).toHaveBeenCalledTimes(1)
    expect(mockClient.start).toHaveBeenCalledWith({
      healthPollInterval: 15000,
      initialRobots: [],
      // support for legacy (pre-v3.3.0) IPv6 wired robots
      manualAddresses: [{ ip: 'fd00:0:cafe:fefe::1', port: 31950 }],
    })
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
    expect(mockClient.start).toHaveBeenLastCalledWith({
      healthPollInterval: 3000,
    })

    handleAction({ type: 'discovery:FINISH' })
    expect(mockClient.start).toHaveBeenLastCalledWith({
      healthPollInterval: 15000,
    })
  })

  it('sets poll speed on "shell:UI_INTIALIZED"', () => {
    const handleAction = registerDiscovery(dispatch)

    handleAction({ type: 'shell:UI_INITIALIZED' })
    expect(mockClient.start).toHaveBeenLastCalledWith({
      healthPollInterval: 3000,
    })
  })

  it('always sends "discovery:UPDATE_LIST" on "discovery:START"', () => {
    const expected = [
      { name: 'opentrons', health: null, serverHealth: null, addresses: [] },
    ]

    mockClient.getRobots.mockReturnValue(expected)
    registerDiscovery(dispatch)({ type: 'discovery:START' })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'discovery:UPDATE_LIST',
      payload: { robots: expected },
    })
  })

  it('calls client.removeRobot on discovery:REMOVE', () => {
    const handleAction = registerDiscovery(dispatch)
    handleAction({
      type: 'discovery:REMOVE',
      payload: { robotName: 'robot-name' },
    })

    expect(mockClient.removeRobot).toHaveBeenCalledWith('robot-name')
  })

  describe('robot list caching', () => {
    it('stores services to when onListUpdate is called', () => {
      registerDiscovery(dispatch)
      expect(Store).toHaveBeenCalledWith({
        name: 'discovery',
        defaults: { robots: [] },
      })

      mockClient.getRobots.mockReturnValue([{ name: 'foo' }, { name: 'bar' }])
      emitListChange()

      expect(Store.__store.set).toHaveBeenLastCalledWith('robots', [
        { name: 'foo' },
        { name: 'bar' },
      ])
    })

    it('loads robots from cache on client initialization', () => {
      const mockRobot = { name: 'foo' }

      Store.__store.get.mockImplementation(key => {
        if (key === 'robots') return [mockRobot]
        return null
      })

      registerDiscovery(dispatch)
      expect(mockClient.start).toHaveBeenCalledWith(
        expect.objectContaining({
          initialRobots: [mockRobot],
        })
      )
    })

    it('loads legacy services from cache on client initialization', () => {
      const services = [
        {
          name: 'opentrons',
          ip: '192.168.1.1',
          port: 31950,
          local: false,
          ok: false,
          serverOk: true,
          advertising: true,
          health: {
            name: 'opentrons',
            api_version: '3.19.0',
            fw_version: 'v1.0.8-1f0a3d7',
            system_version: 'v1.3.7-2-g9e23b93f41',
          },
          serverHealth: {
            name: 'opentrons',
            apiServerVersion: '3.19.0',
            updateServerVersion: '3.19.0',
            smoothieVersion: 'unimplemented',
            systemVersion: 'v1.3.7-2-g9e23b93f41',
            capabilities: {},
          },
        },
        {
          name: 'opentrons',
          ip: '169.254.92.130',
          port: 31950,
          local: false,
          ok: false,
          serverOk: true,
          advertising: true,
          health: {
            name: 'opentrons',
            api_version: '3.19.0',
            fw_version: 'v1.0.8-1f0a3d7',
            system_version: 'v1.3.7-2-g9e23b93f41',
          },
          serverHealth: {
            name: 'opentrons',
            apiServerVersion: '3.19.0',
            updateServerVersion: '3.19.0',
            smoothieVersion: 'unimplemented',
            systemVersion: 'v1.3.7-2-g9e23b93f41',
            capabilities: {},
          },
        },
        {
          name: 'opentrons',
          ip: '169.254.239.127',
          port: 31950,
          local: true,
          ok: false,
          serverOk: false,
          advertising: false,
          health: null,
          serverHealth: null,
        },
        {
          name: 'unknown',
          ip: null,
          port: 31950,
          local: true,
          ok: false,
          serverOk: false,
          advertising: false,
          health: null,
          serverHealth: null,
        },
      ]

      Store.__store.get.mockImplementation(key => {
        if (key === 'services') return services
        return null
      })

      registerDiscovery(dispatch)
      expect(Store.__store.delete).toHaveBeenCalledWith('services')
      expect(mockClient.start).toHaveBeenCalledWith(
        expect.objectContaining({
          initialRobots: [
            {
              name: 'opentrons',
              health: null,
              serverHealth: null,
              addresses: [
                {
                  ip: '192.168.1.1',
                  port: 31950,
                  seen: false,
                  healthStatus: null,
                  serverHealthStatus: null,
                  healthError: null,
                  serverHealthError: null,
                },
                {
                  ip: '169.254.92.130',
                  port: 31950,
                  seen: false,
                  healthStatus: null,
                  serverHealthStatus: null,
                  healthError: null,
                  serverHealthError: null,
                },
                {
                  ip: '169.254.239.127',
                  port: 31950,
                  seen: false,
                  healthStatus: null,
                  serverHealthStatus: null,
                  healthError: null,
                  serverHealthError: null,
                },
              ],
            },
            {
              name: 'unknown',
              health: null,
              serverHealth: null,
              addresses: [],
            },
          ],
        })
      )
    })

    it('can delete cached robots', () => {
      const handleAction = registerDiscovery(dispatch)
      mockClient.start.mockReset()

      handleAction({
        type: 'discovery:CLEAR_CACHE',
        meta: { shell: true },
      })

      expect(mockClient.start).toHaveBeenCalledWith(
        expect.objectContaining({
          initialRobots: [],
        })
      )
    })

    it('does not update services from store when caching disabled', () => {
      // cache has been disabled
      getFullConfig.mockReturnValue({
        discovery: {
          candidates: [],
          disableCache: true,
        },
      })

      // discovery.json contains 1 entry
      Store.__store.get.mockImplementation(key => {
        if (key === 'robots') return [{ name: 'foo' }]
        return null
      })

      registerDiscovery(dispatch)

      // should not contain above entry
      expect(mockClient.start).toHaveBeenCalledWith(
        expect.objectContaining({
          initialRobots: [],
        })
      )
    })

    it('should clear cache and suspend caching when caching becomes disabled', () => {
      // Cache enabled initially
      getFullConfig.mockReturnValue({
        discovery: {
          candidates: [],
          disableCache: false,
        },
      })
      // discovery.json contains 1 entry
      Store.__store.get.mockImplementation(key => {
        if (key === 'robots') return [{ name: 'foo' }]
        return null
      })

      registerDiscovery(dispatch)

      // the 'discovery.disableCache' change handler
      const changeHandler = handleConfigChange.mock.calls[1][1]
      const disableCache = true
      changeHandler(disableCache)

      expect(Store.__store.set).toHaveBeenCalledWith('robots', [])

      // new services discovered
      Store.__store.set.mockClear()
      mockClient.getRobots.mockReturnValue([{ name: 'foo' }, { name: 'bar' }])
      emitListChange()

      // but discovery.json should not update
      expect(Store.__store.set).toHaveBeenCalledTimes(0)
    })
  })

  describe('manual addresses', () => {
    it('loads candidates from config on client initialization', () => {
      getFullConfig.mockReturnValue({
        discovery: { cacheDisabled: false, candidates: ['1.2.3.4'] },
      })

      registerDiscovery(dispatch)

      expect(mockClient.start).toHaveBeenCalledWith(
        expect.objectContaining({
          manualAddresses: expect.arrayContaining([
            { ip: '1.2.3.4', port: 31950 },
          ]),
        })
      )
    })

    // ensures config override works with only one candidate specified
    it('candidates in config can be single string value', () => {
      getFullConfig.mockReturnValue({
        discovery: { cacheDisabled: false, candidates: '1.2.3.4' },
      })

      registerDiscovery(dispatch)

      expect(mockClient.start).toHaveBeenCalledWith(
        expect.objectContaining({
          manualAddresses: expect.arrayContaining([
            { ip: '1.2.3.4', port: 31950 },
          ]),
        })
      )
    })
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
