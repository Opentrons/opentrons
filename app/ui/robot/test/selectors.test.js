// robot selectors test
import {NAME, selectors, constants} from '../'

const makeState = (state) => ({[NAME]: state})

const {
  getConnectionStatus,
  getUploadInProgress,
  getUploadError,
  getSessionName,
  getSessionIsLoaded,
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
  test('getConnectionStatus', () => {
    const state = {
      connection: {
        isConnected: false,
        connectRequest: {inProgress: false},
        disconnectRequest: {inProgress: false}
      }
    }
    expect(getConnectionStatus(makeState(state))).toBe(constants.DISCONNECTED)

    state.connection = {
      isConnected: false,
      connectRequest: {inProgress: true},
      disconnectRequest: {inProgress: false}
    }
    expect(getConnectionStatus(makeState(state))).toBe(constants.CONNECTING)

    state.connection = {
      isConnected: true,
      connectRequest: {inProgress: false},
      disconnectRequest: {inProgress: false}
    }
    expect(getConnectionStatus(makeState(state))).toBe(constants.CONNECTED)

    state.connection = {
      isConnected: true,
      connectRequest: {inProgress: false},
      disconnectRequest: {inProgress: true}
    }
    expect(getConnectionStatus(makeState(state))).toBe(constants.DISCONNECTING)
  })

  test('getUploadInProgress', () => {
    let state = makeState({session: {sessionRequest: {inProgress: true}}})
    expect(getUploadInProgress(state)).toBe(true)

    state = makeState({session: {sessionRequest: {inProgress: false}}})
    expect(getUploadInProgress(state)).toBe(false)
  })

  test('getUploadError', () => {
    let state = makeState({session: {sessionRequest: {error: null}}})
    expect(getUploadError(state)).toBe(null)

    state = makeState({session: {sessionRequest: {error: new Error('AH')}}})
    expect(getUploadError(state)).toEqual(new Error('AH'))
  })

  test('getSessionName', () => {
    const state = makeState({session: {name: 'foobar.py'}})

    expect(getSessionName(state)).toBe('foobar.py')
  })

  test('getSessionIsLoaded', () => {
    let state = makeState({session: {state: constants.LOADED}})
    expect(getSessionIsLoaded(state)).toBe(true)

    state = makeState({session: {state: ''}})
    expect(getSessionIsLoaded(state)).toBe(false)
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
      const state = makeState({session: {state: sessionState}})
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
      const state = makeState({session: {state: sessionState}})
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
      const state = makeState({session: {state: sessionState}})
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
      const state = makeState({session: {state: sessionState}})
      const expected = expectedStates[sessionState]
      expect(getIsDone(state)).toBe(expected)
    })
  })

  describe('command based', () => {
    const state = makeState({
      session: {
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
      }
    })

    test('getRunProgress', () => {
      expect(getRunProgress(state)).toEqual(50)
    })

    test('getStartTime', () => {
      expect(getStartTime(state)).toEqual('2017-08-30T12:00:00Z')
    })

    test('getStartTime without commands', () => {
      expect(getStartTime(makeState({session: {protocolCommands: []}})))
        .toEqual('')
    })

    test('getRunTime', () => {
      const testGetRunTime = (seconds, expected) => {
        const stateWithRunTime = {
          [NAME]: {
            session: {
              ...state[NAME].session,
              runTime: Date.parse('2017-08-30T12:00:00.123Z') + (1000 * seconds)
            }
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
      expect(getRunTime(makeState({session: {protocolCommands: []}})))
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
      session: {
        protocolInstrumentsByAxis: {
          left: {axis: 'left', name: 'p200m', channels: 8, volume: 200},
          right: {axis: 'right', name: 'p50s', channels: 1, volume: 50}
        }
      },
      calibration: {
        instrumentsByAxis: {
          left: constants.PROBING
        }
      }
    })

    expect(getInstruments(state)).toEqual([
      {
        axis: 'left',
        name: 'p200m',
        channels: 'multi',
        volume: 200,
        calibration: constants.PROBING
      },
      {
        axis: 'right',
        name: 'p50s',
        channels: 'single',
        volume: 50,
        calibration: constants.UNPROBED
      }
    ])
  })

  test('get instruments are calibrated', () => {
    const twoPipettesCalibrated = makeState({
      session: {
        protocolInstrumentsByAxis: {
          left: {name: 'p200', axis: 'left', channels: 8, volume: 200},
          right: {name: 'p50', axis: 'right', channels: 1, volume: 50}
        }
      },
      calibration: {
        instrumentsByAxis: {
          left: constants.PROBED,
          right: constants.PROBED
        }
      }
    })

    const twoPipettesNotCalibrated = makeState({
      session: {
        protocolInstrumentsByAxis: {
          left: {name: 'p200', axis: 'left', channels: 8, volume: 200},
          right: {name: 'p50', axis: 'right', channels: 1, volume: 50}
        }
      },
      calibration: {
        instrumentsByAxis: {
          left: constants.UNPROBED,
          right: constants.UNPROBED
        }
      }
    })

    const onePipetteCalibrated = makeState({
      session: {
        protocolInstrumentsByAxis: {
          right: {name: 'p50', axis: 'right', channels: 1, volume: 50}
        }
      },
      calibration: {
        instrumentsByAxis: {
          right: constants.PROBED
        }
      }
    })

    expect(getInstrumentsCalibrated(twoPipettesCalibrated)).toBe(true)
    expect(getInstrumentsCalibrated(twoPipettesNotCalibrated)).toBe(false)
    expect(getInstrumentsCalibrated(onePipetteCalibrated)).toBe(true)
  })

  test('get labware', () => {
    const state = makeState({
      session: {
        protocolLabwareBySlot: {
          1: {id: 'A1', slot: 1, name: 'a1', type: 'a', isTiprack: true},
          5: {id: 'B2', slot: 5, name: 'b2', type: 'b', isTiprack: false},
          9: {id: 'C3', slot: 9, name: 'c3', type: 'c', isTiprack: false}
        }
      },
      calibration: {
        labwareBySlot: {
          1: constants.UNCONFIRMED,
          5: constants.CONFIRMED
        }
      }
    })

    expect(getLabware(state)).toEqual([
      {
        slot: 1,
        id: 'A1',
        name: 'a1',
        type: 'a',
        isTiprack: true,
        calibration: constants.UNCONFIRMED
      },
      {slot: 2},
      {slot: 3},
      {slot: 4},
      {
        slot: 5,
        id: 'B2',
        name: 'b2',
        type: 'b',
        isTiprack: false,
        calibration: constants.CONFIRMED
      },
      {slot: 6},
      {slot: 7},
      {slot: 8},
      {
        slot: 9,
        id: 'C3',
        name: 'c3',
        type: 'c',
        isTiprack: false,
        calibration: constants.UNCONFIRMED
      },
      {slot: 10},
      {slot: 11}
    ])
  })
})
