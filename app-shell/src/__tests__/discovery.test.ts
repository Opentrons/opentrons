// tests for the app-shell's discovery module
import { app } from 'electron'
import Store from 'electron-store'
import noop from 'lodash/noop'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  finishDiscovery,
  startDiscovery,
} from '@opentrons/app/src/redux/discovery'
import * as DiscoveryClient from '@opentrons/discovery-client'

import * as Cfg from '../config'
import {
  __resetDiscoveryForTesting,
  registerDiscovery,
  unregisterDiscovery,
} from '../discovery'
import * as SysInfo from '../system-info'
import { getSerialPortHttpAgent } from '../usb'

vi.mock('electron')
vi.mock('electron-store')
vi.mock('../usb')
vi.mock('@opentrons/discovery-client')
vi.mock('../config')
vi.mock('../system-info')
vi.mock('../log', () => {
  return {
    createLogger: () => {
      return { debug: () => null }
    },
  }
})
vi.mock('../notifications')

let mockGet = vi.fn(property => {
  return []
})
let mockOnDidChange = vi.fn()
let mockDelete = vi.fn()
let mockSet = vi.fn()
describe('app-shell/discovery', () => {
  const dispatch = vi.fn()
  const dispatch2 = vi.fn()
  const mockClient = {
    start: vi.fn(),
    stop: vi.fn(),
    getRobots: vi.fn(),
    removeRobot: vi.fn(),
  }

  const emitListChange = (): void => {
    const lastCall = vi.mocked(DiscoveryClient.createDiscoveryClient).mock
      .calls[
      vi.mocked(DiscoveryClient.createDiscoveryClient).mock.calls.length - 1
    ]
    if (lastCall && lastCall[0]) {
      const { onListChange } = lastCall[0]
      onListChange([])
    }
  }

  beforeEach(() => {
    __resetDiscoveryForTesting()

    mockGet = vi.fn(property => {
      return []
    })
    mockDelete = vi.fn()
    mockOnDidChange = vi.fn()
    mockSet = vi.fn()
    vi.mocked(Store).mockImplementation(() => {
      return {
        get: mockGet,
        set: mockSet,
        delete: mockDelete,
        onDidAnyChange: mockOnDidChange,
      } as any
    })
    vi.mocked(Cfg.getFullConfig).mockReturnValue(({
      discovery: { disableCache: false, candidates: [] },
    } as unknown) as Cfg.Config)

    vi.mocked(Cfg.getOverrides).mockReturnValue({})
    vi.mocked(SysInfo.createNetworkInterfaceMonitor).mockReturnValue({
      stop: noop,
    })
    vi.mocked(DiscoveryClient.createDiscoveryClient).mockReturnValue(mockClient)
    vi.mocked(getSerialPortHttpAgent).mockReturnValue({} as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('registerDiscovery creates a DiscoveryClient', () => {
    registerDiscovery(dispatch)

    expect(
      vi.mocked(DiscoveryClient.createDiscoveryClient)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        onListChange: expect.any(Function),
      })
    )
  })

  it('registerDiscovery creates a DiscoveryClient only once for multiple dispatchers', () => {
    registerDiscovery(dispatch)
    registerDiscovery(dispatch2)

    expect(
      vi.mocked(DiscoveryClient.createDiscoveryClient)
    ).toHaveBeenCalledTimes(1)
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

  it('sends current robots to secondary dispatchers immediately', () => {
    const robots = [{ name: 'robot1' }, { name: 'robot2' }]
    mockClient.getRobots.mockReturnValue(robots)

    registerDiscovery(dispatch)
    registerDiscovery(dispatch2)

    expect(dispatch2).toHaveBeenCalledWith({
      type: 'discovery:UPDATE_LIST',
      payload: { robots },
    })
  })

  it('calls client.stop when electron app emits "will-quit"', () => {
    expect(vi.mocked(app.once)).toHaveBeenCalledTimes(0)

    registerDiscovery(dispatch)

    expect(mockClient.stop).toHaveBeenCalledTimes(0)
    expect(vi.mocked(app.once)).toHaveBeenCalledTimes(1)

    const [event, handler] = vi.mocked(app.once).mock.calls[0]
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

  it('sets poll speed on "discovery:START" and "discovery:FINISH" only for main dispatcher', () => {
    const handleAction1 = registerDiscovery(dispatch)
    const handleAction2 = registerDiscovery(dispatch2)

    const initialCallCount = mockClient.start.mock.calls.length

    handleAction1(startDiscovery())
    expect(mockClient.start).toHaveBeenCalledTimes(initialCallCount + 1)

    handleAction2(startDiscovery())
    expect(mockClient.start).toHaveBeenCalledTimes(initialCallCount + 1)

    handleAction1(finishDiscovery())
    expect(mockClient.start).toHaveBeenCalledTimes(initialCallCount + 2)

    handleAction2(finishDiscovery())
    expect(mockClient.start).toHaveBeenCalledTimes(initialCallCount + 2)
  })

  it('sets poll speed on "shell:UI_INTIALIZED"', () => {
    const handleAction = registerDiscovery(dispatch)

    handleAction({ type: 'shell:UI_INITIALIZED', meta: { shell: true } })
    expect(mockClient.start).toHaveBeenLastCalledWith({
      healthPollInterval: 3000,
    })
  })

  it('sets poll speed on "shell:UI_INTIALIZED" only for main dispatcher', () => {
    const handleAction1 = registerDiscovery(dispatch)
    const handleAction2 = registerDiscovery(dispatch2)

    const initialCallCount = mockClient.start.mock.calls.length

    handleAction1({ type: 'shell:UI_INITIALIZED', meta: { shell: true } })
    expect(mockClient.start).toHaveBeenCalledTimes(initialCallCount + 1)

    handleAction2({ type: 'shell:UI_INITIALIZED', meta: { shell: true } })
    expect(mockClient.start).toHaveBeenCalledTimes(initialCallCount + 1)
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

  it('sends "discovery:UPDATE_LIST" to all dispatchers on "discovery:START"', () => {
    const expected = [
      { name: 'opentrons', health: null, serverHealth: null, addresses: [] },
    ]

    mockClient.getRobots.mockReturnValue(expected)
    const handleAction1 = registerDiscovery(dispatch)
    registerDiscovery(dispatch2)

    handleAction1(startDiscovery())

    expect(dispatch).toHaveBeenCalledWith({
      type: 'discovery:UPDATE_LIST',
      payload: { robots: expected },
    })
    expect(dispatch2).toHaveBeenCalledWith({
      type: 'discovery:UPDATE_LIST',
      payload: { robots: expected },
    })
  })

  it('calls client.removeRobot on discovery:REMOVE', () => {
    const handleAction = registerDiscovery(dispatch)
    handleAction({
      type: 'discovery:REMOVE',
      payload: { robotName: 'robot-name' },
      meta: { shell: true },
    })

    expect(mockClient.removeRobot).toHaveBeenCalledWith('robot-name')
  })

  it('calls client.removeRobot on discovery:REMOVE only for main dispatcher', () => {
    const handleAction1 = registerDiscovery(dispatch)
    const handleAction2 = registerDiscovery(dispatch2)

    handleAction1({
      type: 'discovery:REMOVE',
      payload: { robotName: 'robot-name' },
      meta: { shell: true },
    })
    expect(mockClient.removeRobot).toHaveBeenCalledWith('robot-name')

    mockClient.removeRobot.mockClear()
    handleAction2({
      type: 'discovery:REMOVE',
      payload: { robotName: 'robot-name' },
      meta: { shell: true },
    })
    expect(mockClient.removeRobot).not.toHaveBeenCalled()
  })

  it('unregisterDiscovery removes dispatcher from the set', () => {
    const robots = [{ name: 'robot1' }]
    mockClient.getRobots.mockReturnValue(robots)

    registerDiscovery(dispatch)
    registerDiscovery(dispatch2)

    unregisterDiscovery(dispatch2)

    emitListChange()

    expect(dispatch).toHaveBeenCalledWith({
      type: 'discovery:UPDATE_LIST',
      payload: { robots },
    })
    // dispatch2 should only have been called once during registration, not from emitListChange
    expect(dispatch2).toHaveBeenCalledTimes(1)
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

      expect(vi.mocked(mockSet)).toHaveBeenLastCalledWith('robots', [
        { name: 'foo' },
        { name: 'bar' },
      ])
    })

    it('sends updates to all dispatchers when robot list changes', () => {
      registerDiscovery(dispatch)
      registerDiscovery(dispatch2)

      mockClient.getRobots.mockReturnValue([{ name: 'foo' }, { name: 'bar' }])
      emitListChange()

      expect(dispatch).toHaveBeenCalledWith({
        type: 'discovery:UPDATE_LIST',
        payload: { robots: [{ name: 'foo' }, { name: 'bar' }] },
      })
      expect(dispatch2).toHaveBeenCalledWith({
        type: 'discovery:UPDATE_LIST',
        payload: { robots: [{ name: 'foo' }, { name: 'bar' }] },
      })
    })

    it('loads robots from cache on client initialization', () => {
      const mockRobot = { name: 'foo' }

      vi.mocked(mockGet).mockImplementation((key: string) => {
        if (key === 'robots') return [mockRobot]
        return null as any
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
            serialNumber: '123456789',
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

      vi.mocked(mockGet).mockImplementation((key: string) => {
        if (key === 'services') return services
        return null as any
      })

      registerDiscovery(dispatch)
      expect(mockDelete).toHaveBeenCalledWith('services')
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
                  advertisedModel: null,
                },
                {
                  ip: '169.254.92.130',
                  port: 31950,
                  seen: false,
                  healthStatus: null,
                  serverHealthStatus: null,
                  healthError: null,
                  serverHealthError: null,
                  advertisedModel: null,
                },
                {
                  ip: '169.254.239.127',
                  port: 31950,
                  seen: false,
                  healthStatus: null,
                  serverHealthStatus: null,
                  healthError: null,
                  serverHealthError: null,
                  advertisedModel: null,
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

    it('can delete cached robots only via main dispatcher', () => {
      const handleAction1 = registerDiscovery(dispatch)
      const handleAction2 = registerDiscovery(dispatch2)
      mockClient.start.mockReset()

      handleAction1({
        type: 'discovery:CLEAR_CACHE',
        meta: { shell: true },
      })

      expect(mockClient.start).toHaveBeenCalledWith(
        expect.objectContaining({
          initialRobots: [],
        })
      )

      mockClient.start.mockReset()
      handleAction2({
        type: 'discovery:CLEAR_CACHE',
        meta: { shell: true },
      })

      expect(mockClient.start).not.toHaveBeenCalled()
    })

    it('does not update services from store when caching disabled', () => {
      // cache has been disabled
      vi.mocked(Cfg.getFullConfig).mockReturnValue(({
        discovery: {
          candidates: [],
          disableCache: true,
        },
      } as unknown) as Cfg.Config)

      // discovery.json contains 1 entry
      mockGet.mockImplementation((key: string) => {
        if (key === 'robots') return [{ name: 'foo' }]
        return null as any
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
      vi.mocked(Cfg.getFullConfig).mockReturnValue(({
        discovery: {
          candidates: [],
          disableCache: false,
        },
      } as unknown) as Cfg.Config)

      // discovery.json contains 1 entry
      mockGet.mockImplementation((key: string) => {
        if (key === 'robots') return [{ name: 'foo' }]
        return null as any
      })

      registerDiscovery(dispatch)

      const disableCacheCall = vi
        .mocked(Cfg.handleConfigChange)
        .mock.calls.find(call => call[0] === 'discovery.disableCache')
      expect(disableCacheCall).toBeDefined()

      const changeHandler = disableCacheCall?.[1]
      const disableCache = true
      changeHandler?.(disableCache, false)

      expect(mockSet).toHaveBeenCalledWith('robots', [])

      // new services discovered
      mockSet.mockClear()
      mockClient.getRobots.mockReturnValue([{ name: 'foo' }, { name: 'bar' }])
      emitListChange()

      // but discovery.json should not update
      expect(mockSet).toHaveBeenCalledTimes(0)
    })
  })

  describe('manual addresses', () => {
    it('loads candidates from config on client initialization', () => {
      vi.mocked(Cfg.getFullConfig).mockReturnValue(({
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
      vi.mocked(Cfg.getFullConfig).mockReturnValue(({
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
