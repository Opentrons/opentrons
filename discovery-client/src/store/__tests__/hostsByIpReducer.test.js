// @flow
// discovery client reducer
import {
  mockHealthResponse,
  mockServerHealthResponse,
  mockHealthErrorJsonResponse,
  mockHealthFetchErrorResponse,
} from '../../__fixtures__/health'

import * as Constants from '../../constants'
import * as Actions from '../actions'
import { reducer, hostsByIpReducer } from '../reducer'

describe('hostsByIp reducer', () => {
  it('should return an empty initial state under hostsByIp in the root reducer', () => {
    const state = reducer(undefined, ({}: any))
    expect(state.hostsByIp).toEqual({})
  })

  it('should not overwrite state if a "client:INITIALIZE_STATE" action has no robots', () => {
    const initialState = {
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
    }
    const action = Actions.initializeState({})
    const state = hostsByIpReducer(initialState, action)

    expect(state).toBe(initialState)
  })

  it('should overwrite state with robots from "client:INITIALIZE_STATE"', () => {
    const initialState = {
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
    }

    const action = Actions.initializeState({
      initialRobots: [
        {
          name: 'opentrons-1',
          health: mockHealthResponse,
          serverHealth: mockServerHealthResponse,
          addresses: [
            {
              ip: '127.0.0.2',
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
          name: 'opentrons-2',
          health: null,
          serverHealth: mockServerHealthResponse,
          addresses: [
            {
              ip: '127.0.0.3',
              port: 31950,
              seen: true,
              healthStatus: Constants.HEALTH_STATUS_NOT_OK,
              serverHealthStatus: Constants.HEALTH_STATUS_NOT_OK,
              healthError: mockHealthErrorJsonResponse,
              serverHealthError: mockHealthErrorJsonResponse,
            },
            {
              ip: '127.0.0.4',
              port: 31950,
              seen: false,
              healthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
              serverHealthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
              healthError: mockHealthFetchErrorResponse,
              serverHealthError: mockHealthFetchErrorResponse,
            },
          ],
        },
        {
          name: 'opentrons-3',
          health: mockHealthResponse,
          serverHealth: null,
          addresses: [],
        },
      ],
    })
    const state = hostsByIpReducer(initialState, action)

    expect(state).toEqual({
      '127.0.0.2': {
        ip: '127.0.0.2',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-1',
      },
      '127.0.0.3': {
        ip: '127.0.0.3',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-2',
      },
      '127.0.0.4': {
        ip: '127.0.0.4',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-2',
      },
    })
  })

  it('should handle an "mdns:SERVICE_FOUND" action for a new ip', () => {
    const action = Actions.serviceFound({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
    })
    const initialState = {}

    expect(hostsByIpReducer(initialState, action)).toEqual({
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: true,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
    })
  })

  it('should handle an "mdns:SERVICE_FOUND" action for an existing, un-polled ip', () => {
    const action = Actions.serviceFound({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
    })
    const initialState = {
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
    }
    const nextState = hostsByIpReducer(initialState, action)

    expect(nextState).toEqual({
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: true,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
    })
  })

  it('should handle an "mdns:SERVICE_FOUND" action for an existing, polled ip', () => {
    const action = Actions.serviceFound({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
    })
    const initialState = {
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: true,
        healthStatus: Constants.HEALTH_STATUS_OK,
        serverHealthStatus: Constants.HEALTH_STATUS_NOT_OK,
        healthError: null,
        serverHealthError: mockHealthErrorJsonResponse,
        robotName: 'opentrons-dev',
      },
    }
    const nextState = hostsByIpReducer(initialState, action)

    // ensure new object is _not_ created
    expect(nextState).toBe(initialState)
  })

  it('should handle an "mdns:SERVICE_FOUND" action for an existing ip with an old robot name', () => {
    const action = Actions.serviceFound({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
    })
    const initialState = {
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: false,
        healthStatus: Constants.HEALTH_STATUS_NOT_OK,
        serverHealthStatus: Constants.HEALTH_STATUS_NOT_OK,
        healthError: mockHealthErrorJsonResponse,
        serverHealthError: mockHealthErrorJsonResponse,
        robotName: 'opentrons-old-dev',
      },
    }
    const nextState = hostsByIpReducer(initialState, action)

    expect(nextState).toEqual({
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: true,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
    })
  })

  it('should handle a good "http:HEALTH_POLLED" action for a new ip', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: mockHealthResponse,
      serverHealth: mockServerHealthResponse,
      healthError: null,
      serverHealthError: null,
    })
    const initialState = {}
    const nextState = hostsByIpReducer(initialState, action)

    expect(nextState).toEqual({
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: true,
        healthStatus: Constants.HEALTH_STATUS_OK,
        serverHealthStatus: Constants.HEALTH_STATUS_OK,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
    })
  })

  it('should handle a good "http:HEALTH_POLLED" action for an existing ip', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: mockHealthResponse,
      serverHealth: mockServerHealthResponse,
      healthError: null,
      serverHealthError: null,
    })
    const initialState = {
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: false,
        healthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
        serverHealthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
        healthError: mockHealthFetchErrorResponse,
        serverHealthError: mockHealthFetchErrorResponse,
        robotName: 'opentrons-dev',
      },
    }
    const nextState = hostsByIpReducer(initialState, action)

    expect(nextState).toEqual({
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: true,
        healthStatus: Constants.HEALTH_STATUS_OK,
        serverHealthStatus: Constants.HEALTH_STATUS_OK,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
    })
  })

  it('should handle a good "http:HEALTH_POLLED" action for an existing ip with the wrong robot name', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: mockHealthResponse,
      serverHealth: mockServerHealthResponse,
      healthError: null,
      serverHealthError: null,
    })
    const initialState = {
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: false,
        healthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
        serverHealthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
        healthError: mockHealthFetchErrorResponse,
        serverHealthError: mockHealthFetchErrorResponse,
        robotName: 'not-opentrons-dev',
      },
    }
    const nextState = hostsByIpReducer(initialState, action)

    expect(nextState).toEqual({
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: true,
        healthStatus: Constants.HEALTH_STATUS_OK,
        serverHealthStatus: Constants.HEALTH_STATUS_OK,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
    })
  })

  it('should handle a good "http:HEALTH_POLLED" action that does not change the state', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: mockHealthResponse,
      serverHealth: mockServerHealthResponse,
      healthError: null,
      serverHealthError: null,
    })
    const initialState = {
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: true,
        healthStatus: Constants.HEALTH_STATUS_OK,
        serverHealthStatus: Constants.HEALTH_STATUS_OK,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
    }
    const nextState = hostsByIpReducer(initialState, action)

    expect(nextState).toBe(initialState)
  })

  it('should not reset seen nor robotName with a bad health poll', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: null,
      serverHealth: null,
      healthError: mockHealthFetchErrorResponse,
      serverHealthError: mockHealthFetchErrorResponse,
    })
    const initialState = {
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: true,
        healthStatus: Constants.HEALTH_STATUS_OK,
        serverHealthStatus: Constants.HEALTH_STATUS_OK,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
    }
    const nextState = hostsByIpReducer(initialState, action)

    expect(nextState).toEqual({
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: true,
        healthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
        serverHealthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
        healthError: mockHealthFetchErrorResponse,
        serverHealthError: mockHealthFetchErrorResponse,
        robotName: 'opentrons-dev',
      },
    })
  })

  it('a good health poll will remove any unseen unreachable IPs for the same robot', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: mockHealthResponse,
      serverHealth: mockServerHealthResponse,
      healthError: null,
      serverHealthError: null,
    })
    const initialState = {
      '127.0.0.2': {
        ip: '127.0.0.2',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
      '127.0.0.3': {
        ip: '127.0.0.3',
        port: 31950,
        seen: true,
        healthStatus: Constants.HEALTH_STATUS_NOT_OK,
        serverHealthStatus: Constants.HEALTH_STATUS_NOT_OK,
        healthError: mockHealthErrorJsonResponse,
        serverHealthError: mockHealthErrorJsonResponse,
        robotName: 'opentrons-dev',
      },
      '127.0.0.4': {
        ip: '127.0.0.4',
        port: 31950,
        seen: false,
        healthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
        serverHealthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
        healthError: mockHealthFetchErrorResponse,
        serverHealthError: mockHealthFetchErrorResponse,
        robotName: 'opentrons-dev',
      },
      '127.0.0.5': {
        ip: '127.0.0.5',
        port: 31950,
        seen: false,
        healthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
        serverHealthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
        healthError: mockHealthFetchErrorResponse,
        serverHealthError: mockHealthFetchErrorResponse,
        robotName: 'opentrons-other',
      },
    }
    const nextState = hostsByIpReducer(initialState, action)

    expect(nextState).toEqual({
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: true,
        healthStatus: Constants.HEALTH_STATUS_OK,
        serverHealthStatus: Constants.HEALTH_STATUS_OK,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
      '127.0.0.2': {
        ip: '127.0.0.2',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
      '127.0.0.3': {
        ip: '127.0.0.3',
        port: 31950,
        seen: true,
        healthStatus: Constants.HEALTH_STATUS_NOT_OK,
        serverHealthStatus: Constants.HEALTH_STATUS_NOT_OK,
        healthError: mockHealthErrorJsonResponse,
        serverHealthError: mockHealthErrorJsonResponse,
        robotName: 'opentrons-dev',
      },
      '127.0.0.5': {
        ip: '127.0.0.5',
        port: 31950,
        seen: false,
        healthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
        serverHealthStatus: Constants.HEALTH_STATUS_UNREACHABLE,
        healthError: mockHealthFetchErrorResponse,
        serverHealthError: mockHealthFetchErrorResponse,
        robotName: 'opentrons-other',
      },
    })
  })

  it('should handle "client:REMOVE_ROBOT"', () => {
    const action = Actions.removeRobot('opentrons-dev')
    const initialState = {
      '127.0.0.1': {
        ip: '127.0.0.1',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
      '127.0.0.2': {
        ip: '127.0.0.2',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-dev',
      },
      '127.0.0.3': {
        ip: '127.0.0.3',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-other',
      },
    }
    const nextState = hostsByIpReducer(initialState, action)

    expect(nextState).toEqual({
      '127.0.0.3': {
        ip: '127.0.0.3',
        port: 31950,
        seen: false,
        healthStatus: null,
        serverHealthStatus: null,
        healthError: null,
        serverHealthError: null,
        robotName: 'opentrons-other',
      },
    })
  })
})
