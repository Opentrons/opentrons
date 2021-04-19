// tests for the app-shell's discovery module
import { app } from 'electron'
import Store from 'electron-store'
import { noop } from 'lodash'
import { when } from 'jest-when'

import * as DiscoveryClient from '@opentrons/discovery-client'
import {
  startDiscovery,
  finishDiscovery,
} from '@opentrons/app/src/redux/discovery'
import { registerDiscovery } from '../discovery'
import * as Cfg from '../config'
import * as SysInfo from '../system-info'

jest.mock('electron')
jest.mock('electron-store')
jest.mock('@opentrons/discovery-client')
jest.mock('../config')
jest.mock('../system-info')

const createDiscoveryClient = DiscoveryClient.createDiscoveryClient as jest.MockedFunction<
  typeof DiscoveryClient.createDiscoveryClient
>

const getFullConfig = Cfg.getFullConfig as jest.MockedFunction<
  typeof Cfg.getFullConfig
>

const getOverrides = Cfg.getOverrides as jest.MockedFunction<
  typeof Cfg.getOverrides
>

const handleConfigChange = Cfg.handleConfigChange as jest.MockedFunction<
  typeof Cfg.handleConfigChange
>

const createNetworkInterfaceMonitor = SysInfo.createNetworkInterfaceMonitor as jest.MockedFunction<
  typeof SysInfo.createNetworkInterfaceMonitor
>

const appOnce = app.once as jest.MockedFunction<typeof app.once>

const MockStore = Store as jest.MockedClass<typeof Store>

describe('app-shell/discovery', () => {
  const dispatch = jest.fn()
  const mockClient = {
    start: jest.fn(),
    stop: jest.fn(),
    getRobots: jest.fn(),
    removeRobot: jest.fn(),
  }

  const emitListChange = (): void => {
    const lastCall =
      createDiscoveryClient.mock.calls[
        createDiscoveryClient.mock.calls.length - 1
      ]
    const { onListChange } = lastCall[0]
    onListChange([])
  }

  beforeEach(() => {
    getFullConfig.mockReturnValue(({
      discovery: { disableCache: false, candidates: [] },
    } as unknown) as Cfg.Config)

    getOverrides.mockReturnValue({})
    createNetworkInterfaceMonitor.mockReturnValue({ stop: noop })
    createDiscoveryClient.mockReturnValue(mockClient)

    when(MockStore.prototype.get).calledWith('robots', []).mockReturnValue([])
    when(MockStore.prototype.get)
      .calledWith('services', null)
      .mockReturnValue(null)
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
    expect(appOnce).toHaveBeenCalledTimes(0)

    registerDiscovery(dispatch)

    expect(mockClient.stop).toHaveBeenCalledTimes(0)
    expect(appOnce).toHaveBeenCalledTimes(1)

    const [event, handler] = appOnce.mock.calls[0]
    expect(event).toEqual('will-quit')

    // trigger event handler
    handler()
    expect(mockClient.stop).toHaveBeenCalledTimes(1)
  })

  it('sets poll speed on "discovery:START" and "discovery:FINISH"', () => {
    const handleAction = registerDiscovery(dispatch)

    handleAction(startDiscovery())
    expect(mockClient.start).toHaveBeenLastCalledWith({
      healthPollInterval: 3000,
    })

    handleAction(finishDiscovery())
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
    registerDiscovery(dispatch)(startDiscovery())
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

      expect(MockStore.prototype.set).toHaveBeenLastCalledWith('robots', [
        { name: 'foo' },
        { name: 'bar' },
      ])
    })

    it('loads robots from cache on client initialization', () => {
      const mockRobot = { name: 'foo' }

      MockStore.prototype.get.mockImplementation(key => {
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

      MockStore.prototype.get.mockImplementation(key => {
        if (key === 'services') return services
        return null
      })

      registerDiscovery(dispatch)
      expect(MockStore.prototype.delete).toHaveBeenCalledWith('services')
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
      getFullConfig.mockReturnValue(({
        discovery: {
          candidates: [],
          disableCache: true,
        },
      } as unknown) as Cfg.Config)

      // discovery.json contains 1 entry
      MockStore.prototype.get.mockImplementation(key => {
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
      getFullConfig.mockReturnValue(({
        discovery: {
          candidates: [],
          disableCache: false,
        },
      } as unknown) as Cfg.Config)

      // discovery.json contains 1 entry
      MockStore.prototype.get.mockImplementation(key => {
        if (key === 'robots') return [{ name: 'foo' }]
        return null
      })

      registerDiscovery(dispatch)

      // the 'discovery.disableCache' change handler
      const changeHandler = handleConfigChange.mock.calls[1][1]
      const disableCache = true
      changeHandler(disableCache, false)

      expect(MockStore.prototype.set).toHaveBeenCalledWith('robots', [])

      // new services discovered
      MockStore.prototype.set.mockClear()
      mockClient.getRobots.mockReturnValue([{ name: 'foo' }, { name: 'bar' }])
      emitListChange()

      // but discovery.json should not update
      expect(MockStore.prototype.set).toHaveBeenCalledTimes(0)
    })
  })

  describe('manual addresses', () => {
    it('loads candidates from config on client initialization', () => {
      getFullConfig.mockReturnValue(({
        discovery: { cacheDisabled: false, candidates: ['1.2.3.4'] },
      } as unknown) as Cfg.Config)

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
      getFullConfig.mockReturnValue(({
        discovery: { cacheDisabled: false, candidates: '1.2.3.4' },
      } as unknown) as Cfg.Config)

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
})
