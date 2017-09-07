// robot selectors test
import {NAME, selectors, constants} from '../'

const makeState = (state) => ({[NAME]: state})

const {
  getSessionName,
  getConnectionStatus,
  getCommands,
  getRunProgress,
  getIsReadyToRun,
  getIsRunning,
  getIsPaused,
  getIsDone
} = selectors

describe('robot selectors', () => {
  test('getSessionName', () => {
    const state = makeState({sessionName: 'foobar.py'})
    expect(getSessionName(state)).toBe('foobar.py')
  })

  test('getConnectionStatus', () => {
    let state = {isConnected: false, connectRequest: {inProgress: false}}
    expect(getConnectionStatus(makeState(state))).toBe(constants.DISCONNECTED)

    state = {...state, connectRequest: {inProgress: true}}
    expect(getConnectionStatus(makeState(state))).toBe(constants.CONNECTING)

    state = {isConnected: true, connectRequest: {inProgress: false}}
    expect(getConnectionStatus(makeState(state))).toBe(constants.CONNECTED)
  })

  test('getCommands and getRunProgress', () => {
    const state = makeState({
      protocolCommands: [0, 4],
      protocolCommandsById: {
        0: {
          id: 0,
          description: 'foo',
          handledAt: '2017-08-30T12:00:00',
          children: [1]
        },
        1: {
          id: 1,
          description: 'bar',
          handledAt: '2017-08-30T12:00:01',
          children: [2, 3]
        },
        2: {
          id: 2,
          description: 'baz',
          handledAt: '2017-08-30T12:00:02',
          children: []
        },
        3: {
          id: 3,
          description: 'qux',
          handledAt: '',
          children: []
        },
        4: {
          id: 4,
          description: 'fizzbuzz',
          handledAt: '',
          children: []
        }
      }
    })

    expect(getRunProgress(state)).toEqual(50)
    expect(getCommands(state)).toEqual([
      {
        id: 0,
        description: 'foo',
        handledAt: '2017-08-30T12:00:00',
        isCurrent: true,
        children: [
          {
            id: 1,
            description: 'bar',
            handledAt: '2017-08-30T12:00:01',
            isCurrent: true,
            children: [
              {
                id: 2,
                description: 'baz',
                handledAt: '2017-08-30T12:00:02',
                isCurrent: true,
                children: []
              },
              {
                id: 3,
                description: 'qux',
                handledAt: '',
                isCurrent: false,
                children: []
              }
            ]
          }
        ]
      },
      {
        id: 4,
        description: 'fizzbuzz',
        handledAt: '',
        isCurrent: false,
        children: []
      }
    ])
  })

  test('getIsReadyToRun', () => {
    const expectedStates = {
      loaded: true,
      running: false,
      error: false,
      finished: false,
      stopped: false,
      paused: false
    }

    Object.keys(expectedStates).forEach((sessionState) => {
      const state = makeState({sessionState})
      const expected = expectedStates[sessionState]
      expect(getIsReadyToRun(state)).toBe(expected)
    })
  })

  test('getIsRunning', () => {
    const expectedStates = {
      loaded: false,
      running: true,
      error: false,
      finished: false,
      stopped: false,
      paused: true
    }

    Object.keys(expectedStates).forEach((sessionState) => {
      const state = makeState({sessionState})
      const expected = expectedStates[sessionState]
      expect(getIsRunning(state)).toBe(expected)
    })
  })

  test('getIsPaused', () => {
    const expectedStates = {
      loaded: false,
      running: false,
      error: false,
      finished: false,
      stopped: false,
      paused: true
    }

    Object.keys(expectedStates).forEach((sessionState) => {
      const state = makeState({sessionState})
      const expected = expectedStates[sessionState]
      expect(getIsPaused(state)).toBe(expected)
    })
  })

  test('getIsDone', () => {
    const expectedStates = {
      loaded: false,
      running: false,
      error: true,
      finished: true,
      stopped: true,
      paused: false
    }

    Object.keys(expectedStates).forEach((sessionState) => {
      const state = makeState({sessionState})
      const expected = expectedStates[sessionState]
      expect(getIsDone(state)).toBe(expected)
    })
  })
})
