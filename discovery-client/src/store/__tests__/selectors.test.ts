import type { Agent } from 'http'

import {
  mockLegacyHealthResponse,
  mockLegacyServerHealthResponse,
  mockHealthErrorJsonResponse,
  mockHealthFetchErrorResponse,
} from '../../__fixtures__/health'

import {
  HEALTH_STATUS_OK,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_UNREACHABLE,
} from '../../constants'

import * as Selectors from '../selectors'

import type { State, HostState } from '../types'

const STATE: State = {
  robotsByName: {
    'opentrons-1': {
      name: 'opentrons-1',
      health: mockLegacyHealthResponse,
      serverHealth: mockLegacyServerHealthResponse,
    },
    'opentrons-2': {
      name: 'opentrons-2',
      health: null,
      serverHealth: mockLegacyServerHealthResponse,
    },
    'opentrons-3': {
      name: 'opentrons-3',
      health: mockLegacyHealthResponse,
      serverHealth: null,
    },
  },
  hostsByIp: {
    '127.0.0.2': {
      ip: '127.0.0.2',
      port: 31950,
      seen: false,
      healthStatus: null,
      serverHealthStatus: null,
      healthError: null,
      serverHealthError: null,
      robotName: 'opentrons-1',
      advertisedModel: null,
    },
    '127.0.0.3': {
      ip: '127.0.0.3',
      port: 31950,
      seen: true,
      healthStatus: HEALTH_STATUS_NOT_OK,
      serverHealthStatus: HEALTH_STATUS_NOT_OK,
      healthError: mockHealthErrorJsonResponse,
      serverHealthError: mockHealthErrorJsonResponse,
      robotName: 'opentrons-2',
      advertisedModel: 'OT-2 Standard',
    },
    '127.0.0.4': {
      ip: '127.0.0.4',
      port: 31950,
      seen: false,
      healthStatus: HEALTH_STATUS_UNREACHABLE,
      serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
      healthError: mockHealthFetchErrorResponse,
      serverHealthError: mockHealthFetchErrorResponse,
      robotName: 'opentrons-2',
      advertisedModel: 'OT-2 Standard',
    },
  },
  manualAddresses: [
    { ip: '127.0.0.4', port: 31950 },
    { ip: '127.0.0.5', port: 31950 },
    { ip: '127.0.0.6', port: 31950 },
  ],
}

describe('discovery client state selectors', () => {
  it('should be able to get a list of robot states', () => {
    expect(Selectors.getRobotStates(STATE)).toEqual([
      {
        name: 'opentrons-1',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
      },
      {
        name: 'opentrons-2',
        health: null,
        serverHealth: mockLegacyServerHealthResponse,
      },
      {
        name: 'opentrons-3',
        health: mockLegacyHealthResponse,
        serverHealth: null,
      },
    ])
  })

  it('should be able to get a list of host states', () => {
    expect(Selectors.getHostStates(STATE)).toEqual([
      {
        ip: '127.0.0.2',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-1',
        advertisedModel: null,
      },
      {
        ip: '127.0.0.3',
        port: 31950,
        seen: true,
        healthStatus: HEALTH_STATUS_NOT_OK,
        serverHealthStatus: HEALTH_STATUS_NOT_OK,
        healthError: mockHealthErrorJsonResponse,
        serverHealthError: mockHealthErrorJsonResponse,
        robotName: 'opentrons-2',
        advertisedModel: 'OT-2 Standard',
      },
      {
        ip: '127.0.0.4',
        port: 31950,
        seen: false,
        healthStatus: HEALTH_STATUS_UNREACHABLE,
        serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
        healthError: mockHealthFetchErrorResponse,
        serverHealthError: mockHealthFetchErrorResponse,
        robotName: 'opentrons-2',
        advertisedModel: 'OT-2 Standard',
      },
    ])
  })

  it('should be able to return a list of composite robots', () => {
    expect(Selectors.getRobots(STATE)).toEqual([
      {
        name: 'opentrons-1',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
        addresses: [
          {
            ip: '127.0.0.2',
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
        name: 'opentrons-2',
        health: null,
        serverHealth: mockLegacyServerHealthResponse,
        addresses: [
          {
            ip: '127.0.0.3',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_NOT_OK,
            serverHealthStatus: HEALTH_STATUS_NOT_OK,
            healthError: mockHealthErrorJsonResponse,
            serverHealthError: mockHealthErrorJsonResponse,
            advertisedModel: 'OT-2 Standard',
          },
          {
            ip: '127.0.0.4',
            port: 31950,
            seen: false,
            healthStatus: HEALTH_STATUS_UNREACHABLE,
            serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
            healthError: mockHealthFetchErrorResponse,
            serverHealthError: mockHealthFetchErrorResponse,
            advertisedModel: 'OT-2 Standard',
          },
        ],
      },
      {
        name: 'opentrons-3',
        health: mockLegacyHealthResponse,
        serverHealth: null,
        addresses: [],
      },
    ])
  })

  it('should to get a list addresses to poll', () => {
    expect(Selectors.getAddresses(STATE)).toEqual([
      { ip: '127.0.0.4', port: 31950 },
      { ip: '127.0.0.5', port: 31950 },
      { ip: '127.0.0.6', port: 31950 },
      { ip: '127.0.0.2', port: 31950 },
      { ip: '127.0.0.3', port: 31950 },
    ])
  })

  it('should prefer manual address entries', () => {
    expect(
      Selectors.getAddresses({
        ...STATE,
        manualAddresses: [
          { ip: '127.0.0.4', port: 31950, agent: {} as Agent },
          { ip: '127.0.0.5', port: 31950 },
          { ip: '127.0.0.6', port: 31950 },
        ],
      })
    ).toEqual([
      { agent: {}, ip: '127.0.0.4', port: 31950 },
      { ip: '127.0.0.5', port: 31950 },
      { ip: '127.0.0.6', port: 31950 },
      { ip: '127.0.0.2', port: 31950 },
      { ip: '127.0.0.3', port: 31950 },
    ])
  })

  describe('IP address sorting', () => {
    const sort = (arr: Array<Partial<HostState>>): Array<Partial<HostState>> =>
      arr.sort(
        Selectors.compareHostsByConnectability as (
          a: Partial<HostState>,
          b: Partial<HostState>
        ) => number
      )

    it('should sort addresses with "ok" /health endpoints the highest', () => {
      const ok: Partial<HostState> = {
        ip: '127.0.0.1',
        healthStatus: HEALTH_STATUS_OK,
      }

      const notOk: Partial<HostState> = {
        ip: '127.0.0.2',
        healthStatus: HEALTH_STATUS_NOT_OK,
      }

      const unreachable: Partial<HostState> = {
        ip: '127.0.0.3',
        healthStatus: HEALTH_STATUS_UNREACHABLE,
      }

      const unknown: Partial<HostState> = {
        ip: '127.0.0.4',
        healthStatus: null,
      }

      const result = sort([unknown, unreachable, notOk, ok])
      expect(result).toEqual([ok, notOk, unreachable, unknown])
    })

    it('should fall back to /server/update/health status if /health is the same the highest', () => {
      const ok: Partial<HostState> = {
        ip: '127.0.0.1',
        healthStatus: HEALTH_STATUS_NOT_OK,
        serverHealthStatus: HEALTH_STATUS_OK,
      }

      const notOk: Partial<HostState> = {
        ip: '127.0.0.2',
        healthStatus: HEALTH_STATUS_NOT_OK,
        serverHealthStatus: HEALTH_STATUS_NOT_OK,
      }

      const unreachable: Partial<HostState> = {
        ip: '127.0.0.3',
        healthStatus: HEALTH_STATUS_NOT_OK,
        serverHealthStatus: HEALTH_STATUS_UNREACHABLE,
      }

      const unknown: Partial<HostState> = {
        ip: '127.0.0.4',
        healthStatus: HEALTH_STATUS_NOT_OK,
        serverHealthStatus: null,
      }

      const result = sort([unknown, unreachable, notOk, ok])
      expect(result).toEqual([ok, notOk, unreachable, unknown])
    })

    it('should prefer more local "ip" addresses', () => {
      const home: Partial<HostState> = {
        ip: '127.0.0.1',
        healthStatus: HEALTH_STATUS_OK,
        serverHealthStatus: HEALTH_STATUS_OK,
      }

      const localhost: Partial<HostState> = {
        ip: 'localhost',
        healthStatus: HEALTH_STATUS_OK,
        serverHealthStatus: HEALTH_STATUS_OK,
      }

      const linkLocalV4: Partial<HostState> = {
        ip: '169.254.24.42',
        healthStatus: HEALTH_STATUS_OK,
        serverHealthStatus: HEALTH_STATUS_OK,
      }

      const linkLocalV6: Partial<HostState> = {
        ip: 'fd00:0:cafe:fefe::1',
        healthStatus: HEALTH_STATUS_OK,
        serverHealthStatus: HEALTH_STATUS_OK,
      }

      const regular: Partial<HostState> = {
        ip: '192.168.1.100',
        healthStatus: HEALTH_STATUS_OK,
        serverHealthStatus: HEALTH_STATUS_OK,
      }

      const usb: Partial<HostState> = {
        ip: 'opentrons-usb',
        healthStatus: HEALTH_STATUS_OK,
        serverHealthStatus: HEALTH_STATUS_OK,
      }

      const result = sort([
        usb,
        regular,
        linkLocalV6,
        linkLocalV4,
        localhost,
        home,
      ])
      expect(result).toEqual([
        home,
        localhost,
        linkLocalV4,
        linkLocalV6,
        regular,
        usb,
      ])
    })

    it('should prefer more seen "ip" addresses', () => {
      const unseen: Partial<HostState> = {
        ip: '192.168.1.1',
        healthStatus: HEALTH_STATUS_OK,
        serverHealthStatus: HEALTH_STATUS_OK,
        seen: false,
      }

      const seen: Partial<HostState> = {
        ip: '192.168.1.2',
        healthStatus: HEALTH_STATUS_OK,
        serverHealthStatus: HEALTH_STATUS_OK,
        seen: true,
      }

      const result = sort([unseen, seen])
      expect(result).toEqual([seen, unseen])
    })
  })
})
