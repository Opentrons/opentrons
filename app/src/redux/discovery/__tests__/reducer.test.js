// discovery reducer test
import { restartRobotSuccess } from '../../robot-admin'
import { discoveryReducer } from '../reducer'
import { DISCOVERY_UPDATE_LIST } from '../actions'
import * as Constants from '../constants'

const EXPECTED_INITIAL_STATE = {
  scanning: false,
  robotsByName: {},
  restartingByName: {},
}

describe('discoveryReducer', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const SPECS = [
    {
      name: 'discovery:START sets scanning: true',
      action: { type: 'discovery:START' },
      initialState: { scanning: false },
      expectedState: { scanning: true },
    },
    {
      name: 'shell:UI_INITIALIZED sets scanning: true',
      action: { type: 'shell:UI_INITIALIZED' },
      initialState: { scanning: false },
      expectedState: { scanning: true },
    },
    {
      name: 'discovery:FINISH sets scanning: false',
      action: { type: 'discovery:FINISH' },
      initialState: { scanning: true },
      expectedState: { scanning: false },
    },
    {
      name: 'discovery:UPDATE_LIST resets discovered list',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [
            { name: 'foo', health: null, serverHealth: null, addresses: [] },
            { name: 'bar', health: null, serverHealth: null, addresses: [] },
          ],
        },
      },
      initialState: { robotsByName: {}, restartingByName: {} },
      expectedState: {
        robotsByName: {
          foo: { name: 'foo', health: null, serverHealth: null, addresses: [] },
          bar: { name: 'bar', health: null, serverHealth: null, addresses: [] },
        },
        restartingByName: {},
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, initialState, expectedState } = spec
    it(name, () =>
      expect(discoveryReducer(initialState, action)).toEqual(expectedState)
    )
  })

  it('should have the correct initial state', () => {
    const result = discoveryReducer(undefined, {})

    expect(result).toEqual({
      scanning: false,
      robotsByName: {},
      restartingByName: {},
    })
  })

  it('should set restart pending if restart request succeeds', () => {
    const state = {
      ...EXPECTED_INITIAL_STATE,
      robotsByName: {
        'robot-name': {
          name: 'robot-name',
          health: {},
          serverHealth: {},
          addresses: [],
        },
      },
      restartingByName: {},
    }
    const action = restartRobotSuccess('robot-name')
    const result = discoveryReducer(state, action)

    expect(result.restartingByName).toEqual({
      'robot-name': { bootId: null, status: Constants.RESTART_PENDING_STATUS },
    })
  })

  it('should preserve boot ID if restart request succeeds', () => {
    const state = {
      ...EXPECTED_INITIAL_STATE,
      robotsByName: {
        'robot-name': {
          name: 'robot-name',
          health: {},
          serverHealth: { bootId: 'abc123' },
          addresses: [],
        },
      },
      restartingByName: {},
    }
    const action = restartRobotSuccess('robot-name')
    const result = discoveryReducer(state, action)

    expect(result.restartingByName).toEqual({
      'robot-name': {
        bootId: 'abc123',
        status: Constants.RESTART_PENDING_STATUS,
      },
    })
  })

  it('should clear restarting status if boot ID changes while restarting', () => {
    const state = {
      ...EXPECTED_INITIAL_STATE,
      robotsByName: {},
      restartingByName: {
        'robot-name': {
          bootId: 'abc123',
          status: Constants.RESTART_PENDING_STATUS,
        },
      },
    }
    const action = {
      type: DISCOVERY_UPDATE_LIST,
      payload: {
        robots: [
          {
            name: 'robot-name',
            health: null,
            serverHealth: { bootId: 'def456' },
            addresses: [],
          },
        ],
      },
    }

    const result = discoveryReducer(state, action)

    expect(result.restartingByName).toEqual({
      'robot-name': { bootId: 'abc123', status: null },
    })
  })

  it('should not clear restarting status if next boot ID does not exist', () => {
    const state = {
      ...EXPECTED_INITIAL_STATE,
      robotsByName: {},
      restartingByName: {
        'robot-name': {
          bootId: 'abc123',
          status: Constants.RESTART_PENDING_STATUS,
        },
      },
    }
    const action = {
      type: DISCOVERY_UPDATE_LIST,
      payload: {
        robots: [
          {
            name: 'robot-name',
            addresses: [{ healthStatus: Constants.HEALTH_STATUS_OK }],
          },
        ],
      },
    }

    const result = discoveryReducer(state, action)

    expect(result.restartingByName).toEqual({
      'robot-name': {
        bootId: 'abc123',
        status: Constants.RESTART_PENDING_STATUS,
      },
    })
  })

  it('should set status to RESTARTING if robot goes down', () => {
    const state = {
      ...EXPECTED_INITIAL_STATE,
      robotsByName: {
        'robot-name': {
          name: 'robot-name',
          health: {},
          serverHealth: {},
          addresses: [],
        },
      },
      restartingByName: {
        'robot-name': {
          bootId: null,
          status: Constants.RESTART_PENDING_STATUS,
        },
      },
    }

    const action = {
      type: DISCOVERY_UPDATE_LIST,
      payload: {
        robots: [
          {
            name: 'robot-name',
            addresses: [{ healthStatus: Constants.HEALTH_STATUS_NOT_OK }],
          },
        ],
      },
    }

    const result = discoveryReducer(state, action)
    expect(result.restartingByName).toEqual({
      'robot-name': { bootId: null, status: Constants.RESTARTING_STATUS },
    })
  })

  it('should clear restarting status if robot comes up while restarting', () => {
    const state = {
      ...EXPECTED_INITIAL_STATE,
      robotsByName: {
        'robot-name': {
          name: 'robot-name',
          health: {},
          serverHealth: {},
          addresses: [],
        },
      },
      restartingByName: {
        'robot-name': {
          bootId: null,
          status: Constants.RESTARTING_STATUS,
        },
      },
    }

    const action = {
      type: DISCOVERY_UPDATE_LIST,
      payload: {
        robots: [
          {
            name: 'robot-name',
            addresses: [{ healthStatus: Constants.HEALTH_STATUS_OK }],
          },
        ],
      },
    }

    const result = discoveryReducer(state, action)
    expect(result.restartingByName).toEqual({
      'robot-name': { bootId: null, status: null },
    })
  })
})
