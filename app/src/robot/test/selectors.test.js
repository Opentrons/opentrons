// robot selectors test
import {NAME, selectors, constants} from '../'

const makeState = (state) => ({[NAME]: state})

const {
  getIsScanning,
  getDiscovered,
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
  getCalibratorMount,
  getInstrumentsCalibrated,
  getLabware,
  getUnconfirmedTipracks,
  getUnconfirmedLabware,
  getNextLabware,
  getJogDistance
} = selectors

describe('robot selectors', () => {
  test('getIsScanning', () => {
    let state = {connection: {isScanning: true}}
    expect(getIsScanning(makeState(state))).toBe(true)

    state = {connection: {isScanning: false}}
    expect(getIsScanning(makeState(state))).toBe(false)
  })

  test('getDiscovered', () => {
    const state = {
      connection: {
        connectedTo: 'foo',
        discovered: ['foo', 'bar'],
        discoveredByName: {
          foo: {host: 'abcdef.local', name: 'foo'},
          bar: {host: '123456.local', name: 'bar'}
        }
      }
    }

    expect(getDiscovered(makeState(state))).toEqual([
      {name: 'foo', host: 'abcdef.local', isConnected: true},
      {name: 'bar', host: '123456.local', isConnected: false}
    ])
  })

  test('getConnectionStatus', () => {
    const state = {
      connection: {
        connectedTo: '',
        connectRequest: {inProgress: false},
        disconnectRequest: {inProgress: false}
      }
    }
    expect(getConnectionStatus(makeState(state))).toBe(constants.DISCONNECTED)

    state.connection = {
      connectedTo: '',
      connectRequest: {inProgress: true},
      disconnectRequest: {inProgress: false}
    }
    expect(getConnectionStatus(makeState(state))).toBe(constants.CONNECTING)

    state.connection = {
      connectedTo: 'ot',
      connectRequest: {inProgress: false},
      disconnectRequest: {inProgress: false}
    }
    expect(getConnectionStatus(makeState(state))).toBe(constants.CONNECTED)

    state.connection = {
      connectedTo: 'ot',
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
            handledAt: 42,
            children: [1]
          },
          1: {
            id: 1,
            description: 'bar',
            handledAt: 43,
            children: [2, 3]
          },
          2: {
            id: 2,
            description: 'baz',
            handledAt: 44,
            children: []
          },
          3: {
            id: 3,
            description: 'qux',
            handledAt: null,
            children: []
          },
          4: {
            id: 4,
            description: 'fizzbuzz',
            handledAt: null,
            children: []
          }
        }
      }
    })

    test('getRunProgress', () => {
      // leaves: 2, 3, 4; processed: 2
      expect(getRunProgress(state)).toEqual(1 / 3 * 100)
    })

    test('getRunProgress with no commands', () => {
      const state = makeState({
        session: {protocolCommands: [], protocolCommandsById: {}}
      })

      expect(getRunProgress(state)).toEqual(0)
    })

    test('getStartTime', () => {
      expect(getStartTime(state)).toEqual(42)
    })

    test('getStartTime without commands', () => {
      expect(getStartTime(makeState({session: {protocolCommands: []}})))
        .toEqual(null)
    })

    test('getRunTime', () => {
      const testGetRunTime = (seconds, expected) => {
        const stateWithRunTime = {
          [NAME]: {
            session: {
              ...state[NAME].session,
              runTime: 42 + (1000 * seconds)
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
          handledAt: 42,
          isCurrent: true,
          isLast: false,
          children: [
            {
              id: 1,
              description: 'bar',
              handledAt: 43,
              isCurrent: true,
              isLast: false,
              children: [
                {
                  id: 2,
                  description: 'baz',
                  handledAt: 44,
                  isCurrent: true,
                  isLast: true,
                  children: []
                },
                {
                  id: 3,
                  description: 'qux',
                  handledAt: null,
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
          handledAt: null,
          isCurrent: false,
          isLast: false,
          children: []
        }
      ])
    })
  })

  // TODO(mc: 2018-01-10): rethink the instrument level "calibration" prop
  test('get instruments', () => {
    const state = makeState({
      session: {
        protocolInstrumentsByAxis: {
          left: {axis: 'left', name: 'p200m', channels: 8, volume: 200},
          right: {axis: 'right', name: 'p50s', channels: 1, volume: 50}
        }
      },
      calibration: {
        calibrationRequest: {
          type: 'PROBE_TIP',
          mount: 'left',
          inProgress: true,
          error: null
        },
        probedByAxis: {
          left: true
        }
      }
    })

    expect(getInstruments(state)).toEqual([
      {
        axis: 'left',
        name: 'p200m',
        channels: 8,
        volume: 200,
        calibration: constants.PROBING,
        probed: true
      },
      {
        axis: 'right',
        name: 'p50s',
        channels: 1,
        volume: 50,
        calibration: constants.UNPROBED,
        probed: false
      }
    ])
  })

  test('get jog distance', () => {
    const state = makeState({
      calibration: {jogDistance: constants.JOG_DISTANCE_SLOW_MM}
    })

    expect(getJogDistance(state)).toBe(constants.JOG_DISTANCE_SLOW_MM)
  })

  test('get calibrator mount with single channel installed', () => {
    const state = makeState({
      session: {
        protocolInstrumentsByAxis: {
          left: {axis: 'left', name: 'p200m', channels: 8, volume: 200},
          right: {axis: 'right', name: 'p50s', channels: 1, volume: 50}
        }
      },
      calibration: {
        calibrationRequest: {},
        probedByAxis: {}
      }
    })

    expect(getCalibratorMount(state)).toBe('right')
  })

  test('get calibrator mount with only multi channel installed', () => {
    const state = makeState({
      session: {
        protocolInstrumentsByAxis: {
          left: {axis: 'left', name: 'p200m', channels: 8, volume: 200}
        }
      },
      calibration: {
        calibrationRequest: {},
        probedByAxis: {}
      }
    })

    expect(getCalibratorMount(state)).toBe('left')
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
        calibrationRequest: {},
        probedByAxis: {left: true, right: true}
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
        calibrationRequest: {},
        probedByAxis: {left: false, right: false}
      }
    })

    const onePipetteCalibrated = makeState({
      session: {
        protocolInstrumentsByAxis: {
          right: {name: 'p50', axis: 'right', channels: 1, volume: 50}
        }
      },
      calibration: {
        calibrationRequest: {},
        probedByAxis: {right: true}
      }
    })

    expect(getInstrumentsCalibrated(twoPipettesCalibrated)).toBe(true)
    expect(getInstrumentsCalibrated(twoPipettesNotCalibrated)).toBe(false)
    expect(getInstrumentsCalibrated(onePipetteCalibrated)).toBe(true)
  })

  describe('labware selectors', () => {
    let state

    beforeEach(() => {
      state = makeState({
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
            5: constants.OVER_SLOT
          },
          confirmedBySlot: {
            1: false,
            5: true
          }
        }
      })
    })

    test('get labware', () => {
      expect(getLabware(state)).toEqual([
        {
          slot: 1,
          id: 'A1',
          name: 'a1',
          type: 'a',
          isTiprack: true,
          calibration: constants.UNCONFIRMED,
          confirmed: false
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
          calibration: constants.OVER_SLOT,
          confirmed: true
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
          calibration: constants.UNCONFIRMED,
          confirmed: false
        },
        {slot: 10},
        {slot: 11}
      ])
    })

    test('get unconfirmed tipracks', () => {
      expect(getUnconfirmedTipracks(state)).toEqual([
        {
          slot: 1,
          id: 'A1',
          name: 'a1',
          type: 'a',
          isTiprack: true,
          calibration: constants.UNCONFIRMED,
          confirmed: false
        }
      ])
    })

    test('get unconfirmed labware', () => {
      expect(getUnconfirmedLabware(state)).toEqual([
        {
          slot: 1,
          id: 'A1',
          name: 'a1',
          type: 'a',
          isTiprack: true,
          calibration: constants.UNCONFIRMED,
          confirmed: false
        },
        {
          slot: 9,
          id: 'C3',
          name: 'c3',
          type: 'c',
          isTiprack: false,
          calibration: constants.UNCONFIRMED,
          confirmed: false
        }
      ])
    })

    test('get next labware', () => {
      expect(getNextLabware(state)).toEqual({
        slot: 1,
        id: 'A1',
        name: 'a1',
        type: 'a',
        isTiprack: true,
        calibration: constants.UNCONFIRMED,
        confirmed: false
      })

      const nextState = {
        [NAME]: {
          ...state[NAME],
          calibration: {
            ...state[NAME].calibration,
            confirmedBySlot: {
              ...state[NAME].calibration.confirmedBySlot,
              1: true
            }
          }
        }
      }

      expect(getNextLabware(nextState)).toEqual({
        slot: 9,
        id: 'C3',
        name: 'c3',
        type: 'c',
        isTiprack: false,
        calibration: constants.UNCONFIRMED,
        confirmed: false
      })
    })
  })
})
