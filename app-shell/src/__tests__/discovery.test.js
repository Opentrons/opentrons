// tests for the app-shell's discovery module
import EventEmitter from 'events'
import DiscoveryClient from '@opentrons/discovery-client'
import {registerDiscovery} from '../discovery'
import {getConfig} from '../config'

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
      setPollInterval: jest.fn().mockReturnThis()
    })

    getConfig.mockReturnValue({
      candidates: []
    })

    dispatch = jest.fn()
    DiscoveryClient.mockReturnValue(mockClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('registerDiscovery creates a DiscoveryClient', () => {
    registerDiscovery(dispatch)

    expect(DiscoveryClient).toHaveBeenCalledWith(
      expect.objectContaining({
        nameFilter: /^opentrons/i,
        pollInterval: 5000,
        candidates: []
      })
    )
  })

  test('calls client.start on "discovery:START"', () => {
    registerDiscovery(dispatch)({type: 'discovery:START'})
    expect(mockClient.start).toHaveBeenCalled()
  })

  test('sets client to slow poll on "discovery:FINISH"', () => {
    registerDiscovery(dispatch)({type: 'discovery:FINISH'})
    expect(mockClient.setPollInterval).toHaveBeenCalledWith(15000)
  })

  describe('"service" event handling', () => {
    beforeEach(() => registerDiscovery(dispatch))

    const SPECS = [
      {
        name: 'dispatches discovery:UPDATE_LIST on "service" event',
        services: [
          {name: 'opentrons-dev', ip: '192.168.1.42', port: 31950, ok: true}
        ],
        expected: [
          {
            name: 'opentrons-dev',
            ok: true,
            connections: [{ip: '192.168.1.42', port: 31950, ok: true, local: false}]
          }
        ]
      },
      {
        name: 'handles multiple services',
        services: [
          {name: 'opentrons-1', ip: '192.168.1.42', port: 31950, ok: false},
          {name: 'opentrons-2', ip: '169.254.9.8', port: 31950, ok: true}
        ],
        expected: [
          {
            name: 'opentrons-1',
            ok: false,
            connections: [
              {ip: '192.168.1.42', port: 31950, ok: false, local: false}
            ]
          },
          {
            name: 'opentrons-2',
            ok: true,
            connections: [
              {ip: '169.254.9.8', port: 31950, ok: true, local: true}
            ]
          }
        ]
      },
      {
        name: 'combines multiple services into one robot',
        services: [
          {name: 'opentrons-dev', ip: '192.168.1.42', port: 31950, ok: true},
          {name: 'opentrons-dev', ip: '169.254.9.8', port: 31950, ok: true}
        ],
        expected: [
          {
            name: 'opentrons-dev',
            ok: true,
            connections: [
              {ip: '192.168.1.42', port: 31950, ok: true, local: false},
              {ip: '169.254.9.8', port: 31950, ok: true, local: true}
            ]
          }
        ]
      }
    ]

    SPECS.forEach(spec => test(spec.name, () => {
      mockClient.services = spec.services

      mockClient.emit('service')
      expect(dispatch).toHaveBeenCalledWith({
        type: 'discovery:UPDATE_LIST',
        payload: {robots: spec.expected}
      })
    }))
  })
})
