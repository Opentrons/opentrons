// robot selectors test
import {NAME, selectors, constants} from '../'

const makeState = (state) => ({[NAME]: state})

const {
  getSessionName,
  getConnectionStatus,
  getCommands,
  getRunProgress,
  getStartTime,
  getIsReadyToRun,
  getIsRunning,
  getIsPaused,
  getIsDone,
  getRunTime,
  getInstruments,
  getInstrumentsCalibrated,
  getLabware
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

  describe('command based', () => {
    const state = makeState({
      protocolCommands: [0, 4],
      protocolCommandsById: {
        0: {
          id: 0,
          description: 'foo',
          handledAt: '2017-08-30T12:00:00Z',
          children: [1]
        },
        1: {
          id: 1,
          description: 'bar',
          handledAt: '2017-08-30T12:00:01Z',
          children: [2, 3]
        },
        2: {
          id: 2,
          description: 'baz',
          handledAt: '2017-08-30T12:00:02Z',
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

    test('getRunProgress', () => {
      expect(getRunProgress(state)).toEqual(50)
    })

    test('getStartTime', () => {
      expect(getStartTime(state)).toEqual('2017-08-30T12:00:00Z')
    })

    test('getStartTime without commands', () => {
      expect(getStartTime(makeState({protocolCommands: []})))
        .toEqual('')
    })

    test('getRunTime', () => {
      const testGetRunTime = (seconds, expected) => {
        const stateWithRunTime = {
          ...state,
          [NAME]: {
            ...state[NAME],
            runTime: Date.parse('2017-08-30T12:00:00.123Z') + (1000 * seconds)
          }
        }

        expect(getRunTime(stateWithRunTime)).toEqual(expected)
      }

      testGetRunTime(0, '00:00:00')
      testGetRunTime(1, '00:00:01')
      testGetRunTime(59, '00:00:59')
      testGetRunTime(60, '00:01:00')
      testGetRunTime(61, '00:01:01')
      testGetRunTime(3599, '00:59:59')
      testGetRunTime(3600, '01:00:00')
      testGetRunTime(3601, '01:00:01')
    })

    test('getRunTime without commands', () => {
      expect(getRunTime(makeState({protocolCommands: []})))
        .toEqual('00:00:00')
    })

    test('getCommands', () => {
      expect(getCommands(state)).toEqual([
        {
          id: 0,
          description: 'foo',
          handledAt: '2017-08-30T12:00:00Z',
          isCurrent: true,
          isLast: false,
          children: [
            {
              id: 1,
              description: 'bar',
              handledAt: '2017-08-30T12:00:01Z',
              isCurrent: true,
              isLast: false,
              children: [
                {
                  id: 2,
                  description: 'baz',
                  handledAt: '2017-08-30T12:00:02Z',
                  isCurrent: true,
                  isLast: true,
                  children: []
                },
                {
                  id: 3,
                  description: 'qux',
                  handledAt: '',
                  isCurrent: false,
                  isLast: false,
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
          isLast: false,
          children: []
        }
      ])
    })
  })

  test('get instruments', () => {
    const state = makeState({
      currentInstrument: 'left',
      protocolInstrumentsByAxis: {
        left: {axis: 'left', channels: 8, volume: 200},
        right: {axis: 'right', channels: 1, volume: 50}
      },
      instrumentCalibrationByAxis: {
        left: {isProbed: true}
      }
    })

    expect(getInstruments(state)).toEqual([
      {
        axis: 'left',
        channels: 'multi',
        volume: 200,
        isProbed: true,
        isCurrent: true
      },
      {
        axis: 'right',
        channels: 'single',
        volume: 50,
        isProbed: false,
        isCurrent: false
      }
    ])
  })

  test('get instruments are calibrated', () => {
    const twoPipettesCalibrated = makeState({
      protocolInstrumentsByAxis: {
        left: {name: 'p200', axis: 'left', channels: 8, volume: 200},
        right: {name: 'p50', axis: 'right', channels: 1, volume: 50}
      },
      instrumentCalibrationByAxis: {
        left: {isProbed: true},
        right: {isProbed: true}
      }
    })

    const twoPipettesNotCalibrated = makeState({
      protocolInstrumentsByAxis: {
        left: {name: 'p200', axis: 'left', channels: 8, volume: 200},
        right: {name: 'p50', axis: 'right', channels: 1, volume: 50}
      },
      instrumentCalibrationByAxis: {
        left: {isProbed: true}
      }
    })

    const onePipetteCalibrated = makeState({
      protocolInstrumentsByAxis: {
        left: {name: 'p200', axis: 'left', channels: 8, volume: 200}
      },
      instrumentCalibrationByAxis: {
        left: {isProbed: true}
      }
    })

    expect(getInstrumentsCalibrated(twoPipettesCalibrated)).toBe(true)
    expect(getInstrumentsCalibrated(twoPipettesNotCalibrated)).toBe(false)
    expect(getInstrumentsCalibrated(onePipetteCalibrated)).toBe(true)
  })

  test('get labware', () => {
    const state = makeState({
      currentLabware: 5,
      protocolLabwareBySlot: {
        1: {id: 'A1', slot: 1, name: 'a1', type: 'a', isTiprack: true},
        5: {id: 'B2', slot: 5, name: 'b2', type: 'b', isTiprack: false},
        9: {id: 'C3', slot: 9, name: 'c3', type: 'c', isTiprack: false}
      },
      labwareConfirmationBySlot: {
        1: {isConfirmed: false},
        5: {isConfirmed: true},
        9: {isConfirmed: false}
      }
    })

    expect(getLabware(state)).toEqual([
      {
        slot: 1,
        id: 'A1',
        name: 'a1',
        type: 'a',
        isTiprack: true,
        isConfirmed: false,
        isCurrent: false
      },
      {slot: 2, isCurrent: false},
      {slot: 3, isCurrent: false},
      {slot: 4, isCurrent: false},
      {
        slot: 5,
        id: 'B2',
        name: 'b2',
        type: 'b',
        isTiprack: false,
        isConfirmed: true,
        isCurrent: true
      },
      {slot: 6, isCurrent: false},
      {slot: 7, isCurrent: false},
      {slot: 8, isCurrent: false},
      {
        slot: 9,
        id: 'C3',
        name: 'c3',
        type: 'c',
        isTiprack: false,
        isConfirmed: false,
        isCurrent: false
      },
      {slot: 10, isCurrent: false},
      {slot: 11, isCurrent: false}
    ])
  })
})
