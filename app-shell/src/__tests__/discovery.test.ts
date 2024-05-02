// tests for the app-shell's discovery module
import { app } from 'electron'
import Store from 'electron-store'
import noop from 'lodash/noop'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'

import * as DiscoveryClient from '@opentrons/discovery-client'
import {
  startDiscovery,
  finishDiscovery,
} from '@opentrons/app/src/redux/discovery'
import { registerDiscovery } from '../discovery'
import * as Cfg from '../config'
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
    const { onListChange } = lastCall[0]
    onListChange([])
  }

  beforeEach(() => {
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

  it('sets poll speed on "shell:UI_INTIALIZED"', () => {
    const handleAction = registerDiscovery(dispatch)

    handleAction({ type: 'shell:UI_INITIALIZED', meta: { shell: true } })
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
      meta: { shell: true },
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

      expect(vi.mocked(mockSet)).toHaveBeenLastCalledWith('robots', [
        { name: 'foo' },
        { name: 'bar' },
      ])
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

      // the 'discovery.disableCache' change handler
      const changeHandler = vi.mocked(Cfg.handleConfigChange).mock.calls[1][1]
      const disableCache = true
      changeHandler(disableCache, false)

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
