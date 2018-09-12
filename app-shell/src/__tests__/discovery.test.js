// tests for the app-shell's discovery module
import EventEmitter from 'events'
import Store from 'electron-store'
import DiscoveryClient from '@opentrons/discovery-client'
import {registerDiscovery} from '../discovery'
import {getConfig, getOverrides} from '../config'

jest.mock('electron-store')
jest.mock('@opentrons/discovery-client')
jest.mock('../log')
jest.mock('../config')

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

    getConfig.mockReturnValue({enabled: true, candidates: []})
    getOverrides.mockReturnValue({})

    dispatch = jest.fn()
    DiscoveryClient.mockReturnValue(mockClient)
    Store.__mockReset()
    Store.__store.get.mockImplementation(key => {
      if (key === 'services') return []
      return null
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('registerDiscovery creates a DiscoveryClient', () => {
    registerDiscovery(dispatch)

    expect(DiscoveryClient).toHaveBeenCalledWith(
      expect.objectContaining({
        pollInterval: expect.any(Number),
        // support for legacy IPv6 wired robots
        candidates: ['[fd00:0:cafe:fefe::1]'],
        services: [],
      })
    )
  })

  test('calls client.start on discovery registration', () => {
    registerDiscovery(dispatch)
    expect(mockClient.start).toHaveBeenCalled()
  })

  test('calls client.start on "discovery:START"', () => {
    registerDiscovery(dispatch)({type: 'discovery:START'})
    expect(mockClient.start).toHaveBeenCalledTimes(2)
  })

  test('sets poll speed on "discovery:START" and "discovery:FINISH"', () => {
    const handleAction = registerDiscovery(dispatch)

    handleAction({type: 'discovery:START'})
    expect(mockClient.setPollInterval).toHaveBeenLastCalledWith(
      expect.any(Number)
    )
    handleAction({type: 'discovery:FINISH'})
    expect(mockClient.setPollInterval).toHaveBeenLastCalledWith(
      expect.any(Number)
    )

    expect(mockClient.setPollInterval).toHaveBeenCalledTimes(2)
    const fastPoll = mockClient.setPollInterval.mock.calls[0][0]
    const slowPoll = mockClient.setPollInterval.mock.calls[1][0]
    expect(fastPoll).toBeLessThan(slowPoll)
  })

  test('always sends "discovery:UPDATE_LIST" on "discovery:START"', () => {
    mockClient.services = [
      {name: 'opentrons-dev', ip: '192.168.1.42', port: 31950, ok: true},
    ]

    const expected = [
      {
        name: 'opentrons-dev',
        connections: [
          {ip: '192.168.1.42', port: 31950, ok: true, local: false},
        ],
      },
    ]

    registerDiscovery(dispatch)({type: 'discovery:START'})
    expect(dispatch).toHaveBeenCalledWith({
      type: 'discovery:UPDATE_LIST',
      payload: {robots: expected},
    })
  })

  describe('"service" event handling', () => {
    beforeEach(() => registerDiscovery(dispatch))

    const SPECS = [
      {
        name: 'dispatches discovery:UPDATE_LIST on "service" event',
        services: [
          {name: 'opentrons-dev', ip: '192.168.1.42', port: 31950, ok: true},
        ],
        expected: [
          {
            name: 'opentrons-dev',
            connections: [
              {ip: '192.168.1.42', port: 31950, ok: true, local: false},
            ],
          },
        ],
      },
      {
        name: 'handles multiple services',
        services: [
          {name: 'opentrons-1', ip: '192.168.1.42', port: 31950, ok: false},
          {name: 'opentrons-2', ip: '169.254.9.8', port: 31950, ok: true},
        ],
        expected: [
          {
            name: 'opentrons-1',
            connections: [
              {ip: '192.168.1.42', port: 31950, ok: false, local: false},
            ],
          },
          {
            name: 'opentrons-2',
            connections: [
              {ip: '169.254.9.8', port: 31950, ok: true, local: true},
            ],
          },
        ],
      },
      {
        name: 'combines multiple services into one robot',
        services: [
          {name: 'opentrons-dev', ip: '192.168.1.42', port: 31950, ok: true},
          {name: 'opentrons-dev', ip: '169.254.9.8', port: 31950, ok: true},
        ],
        expected: [
          {
            name: 'opentrons-dev',
            connections: [
              {ip: '192.168.1.42', port: 31950, ok: true, local: false},
              {ip: '169.254.9.8', port: 31950, ok: true, local: true},
            ],
          },
        ],
      },
    ]

    SPECS.forEach(spec =>
      test(spec.name, () => {
        mockClient.services = spec.services

        mockClient.emit('service')
        expect(dispatch).toHaveBeenCalledWith({
          type: 'discovery:UPDATE_LIST',
          payload: {robots: spec.expected},
        })
      })
    )
  })

  test('stores services to file on service events', () => {
    registerDiscovery(dispatch)
    expect(Store).toHaveBeenCalledWith({
      name: 'discovery',
      defaults: {services: []},
    })

    mockClient.services = [{name: 'foo'}, {name: 'bar'}]
    mockClient.emit('service')
    expect(Store.__store.set).toHaveBeenCalledWith('services', [
      {name: 'foo'},
      {name: 'bar'},
    ])

    mockClient.services = [{name: 'foo'}]
    mockClient.emit('serviceRemoved')
    expect(Store.__store.set).toHaveBeenCalledWith('services', [{name: 'foo'}])
  })

  test('loads services from file on client initialization', () => {
    Store.__store.get.mockImplementation(key => {
      if (key === 'services') return [{name: 'foo'}]
      return null
    })

    registerDiscovery(dispatch)
    expect(DiscoveryClient).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [{name: 'foo'}],
      })
    )
  })

  test('loads candidates from config on client initialization', () => {
    getConfig.mockReturnValue({enabled: true, candidates: ['1.2.3.4']})
    registerDiscovery(dispatch)

    expect(DiscoveryClient).toHaveBeenCalledWith(
      expect.objectContaining({
        candidates: expect.arrayContaining(['1.2.3.4']),
      })
    )
  })

  // ensures config override works with only one candidate specified
  test('canidates in config can be single value', () => {
    getConfig.mockReturnValue({enabled: true, candidates: '1.2.3.4'})
    registerDiscovery(dispatch)

    expect(DiscoveryClient).toHaveBeenCalledWith(
      expect.objectContaining({
        candidates: expect.arrayContaining(['1.2.3.4']),
      })
    )
  })

  test('services from overridden canidates are not persisted', () => {
    getConfig.mockReturnValue({enabled: true, candidates: 'localhost'})
    getOverrides.mockImplementation(key => {
      if (key === 'discovery.candidates') return ['1.2.3.4', '5.6.7.8']
      return null
    })

    registerDiscovery(dispatch)

    mockClient.services = [{name: 'foo', ip: '5.6.7.8'}, {name: 'bar'}]
    mockClient.emit('service')
    expect(Store.__store.set).toHaveBeenCalledWith('services', [{name: 'bar'}])
  })

  test('service from overridden single candidate is not persisted', () => {
    getConfig.mockReturnValue({enabled: true, candidates: 'localhost'})
    getOverrides.mockImplementation(key => {
      if (key === 'discovery.candidates') return '1.2.3.4'
      return null
    })

    registerDiscovery(dispatch)

    mockClient.services = [{name: 'foo', ip: '1.2.3.4'}, {name: 'bar'}]
    mockClient.emit('service')
    expect(Store.__store.set).toHaveBeenCalledWith('services', [{name: 'bar'}])
  })
})
