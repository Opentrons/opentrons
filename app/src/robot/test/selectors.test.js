// robot selectors test
import {NAME, selectors, constants} from '../'

const makeState = (state) => ({[NAME]: state})

const {
  getIsScanning,
  getDiscovered,
  getConnectionStatus,
  getSessionLoadInProgress,
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
  getPipettes,
  getCalibratorMount,
  getPipettesCalibrated,
  getLabware,
  getUnconfirmedTipracks,
  getUnconfirmedLabware,
  getNextLabware,
  makeGetCurrentPipette
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
      robot: {
        connection: {
          connectedTo: 'bar',
          discovered: ['foo', 'bar', 'baz', 'qux'],
          discoveredByName: {
            foo: {host: 'abcdef.local', name: 'foo'},
            bar: {host: '123456.local', name: 'bar'},
            baz: {host: 'qwerty.local', name: 'baz'},
            qux: {host: 'dvorak.local', name: 'qux', wired: true}
          }
        }
      }
    }

    expect(getDiscovered(state)).toEqual([
      {
        name: 'bar',
        host: '123456.local',
        isConnected: true
      },
      {
        name: 'qux',
        host: 'dvorak.local',
        isConnected: false,
        wired: true
      },
      {name: 'baz', host: 'qwerty.local', isConnected: false},
      {name: 'foo', host: 'abcdef.local', isConnected: false}
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

  test('getSessionLoadInProgress', () => {
    let state = makeState({session: {sessionRequest: {inProgress: true}}})
    expect(getSessionLoadInProgress(state)).toBe(true)

    state = makeState({session: {sessionRequest: {inProgress: false}}})
    expect(getSessionLoadInProgress(state)).toBe(false)
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

  test('getStartTime', () => {
    const state = makeState({session: {startTime: 42}})
    expect(getStartTime(state)).toBe(42)
  })

  test('getRunTime with no startTime', () => {
    const state = {
      [NAME]: {
        session: {
          startTime: null,
          runTime: 42
        }
      }
    }

    expect(getRunTime(state)).toEqual('00:00:00')
  })

  test('getRunTime', () => {
    const testGetRunTime = (seconds, expected) => {
      const stateWithRunTime = {
        [NAME]: {
          session: {
            startTime: 42,
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

  describe('instrument selectors', () => {
    let state

    beforeEach(() => {
      state = makeState({
        session: {
          pipettesByMount: {
            left: {mount: 'left', name: 'p200m', channels: 8, volume: 200},
            right: {mount: 'right', name: 'p50s', channels: 1, volume: 50}
          }
        },
        calibration: {
          calibrationRequest: {
            type: 'PROBE_TIP',
            mount: 'left',
            inProgress: true,
            error: null
          },
          probedByMount: {
            left: true
          },
          tipOnByMount: {
            right: true
          }
        }
      })
    })

    // TODO(mc: 2018-01-10): rethink the instrument level "calibration" prop
    test('get pipettes', () => {
      expect(getPipettes(state)).toEqual([
        {
          mount: 'left',
          name: 'p200m',
          channels: 8,
          volume: 200,
          calibration: constants.PROBING,
          probed: true,
          tipOn: false
        },
        {
          mount: 'right',
          name: 'p50s',
          channels: 1,
          volume: 50,
          calibration: constants.UNPROBED,
          probed: false,
          tipOn: true
        }
      ])
    })

    test('make get current instrument from props', () => {
      const getCurrentPipette = makeGetCurrentPipette()
      let props = {match: {params: {mount: 'left'}}}

      expect(getCurrentPipette(state, props)).toEqual({
        mount: 'left',
        name: 'p200m',
        channels: 8,
        volume: 200,
        calibration: constants.PROBING,
        probed: true,
        tipOn: false
      })

      props = {match: {params: {mount: 'right'}}}
      expect(getCurrentPipette(state, props)).toEqual({
        mount: 'right',
        name: 'p50s',
        channels: 1,
        volume: 50,
        calibration: constants.UNPROBED,
        probed: false,
        tipOn: true
      })

      props = {match: {params: {}}}
      expect(getCurrentPipette(state, props)).toBeFalsy()
    })
  })

  test('get calibrator mount', () => {
    const leftState = makeState({
      session: {
        pipettesByMount: {
          left: {mount: 'left', name: 'p200m', channels: 8, volume: 200},
          right: {mount: 'right', name: 'p50s', channels: 1, volume: 50}
        }
      },
      calibration: {
        calibrationRequest: {},
        probedByMount: {},
        tipOnByMount: {left: true}
      }
    })

    const rightState = makeState({
      session: {
        pipettesByMount: {
          left: {mount: 'left', name: 'p200m', channels: 8, volume: 200},
          right: {mount: 'right', name: 'p50s', channels: 1, volume: 50}
        }
      },
      calibration: {
        calibrationRequest: {},
        probedByMount: {},
        tipOnByMount: {right: true}
      }
    })

    expect(getCalibratorMount(leftState)).toBe('left')
    expect(getCalibratorMount(rightState)).toBe('right')
  })

  test('get instruments are calibrated', () => {
    const twoPipettesCalibrated = makeState({
      session: {
        pipettesByMount: {
          left: {name: 'p200', mount: 'left', channels: 8, volume: 200},
          right: {name: 'p50', mount: 'right', channels: 1, volume: 50}
        }
      },
      calibration: {
        calibrationRequest: {},
        probedByMount: {left: true, right: true},
        tipOnByMount: {}
      }
    })

    const twoPipettesNotCalibrated = makeState({
      session: {
        pipettesByMount: {
          left: {name: 'p200', mount: 'left', channels: 8, volume: 200},
          right: {name: 'p50', mount: 'right', channels: 1, volume: 50}
        }
      },
      calibration: {
        calibrationRequest: {},
        probedByMount: {left: false, right: false},
        tipOnByMount: {}
      }
    })

    const onePipetteCalibrated = makeState({
      session: {
        pipettesByMount: {
          right: {name: 'p50', mount: 'right', channels: 1, volume: 50}
        }
      },
      calibration: {
        calibrationRequest: {},
        probedByMount: {right: true},
        tipOnByMount: {}
      }
    })

    expect(getPipettesCalibrated(twoPipettesCalibrated)).toBe(true)
    expect(getPipettesCalibrated(twoPipettesNotCalibrated)).toBe(false)
    expect(getPipettesCalibrated(onePipetteCalibrated)).toBe(true)
  })

  describe('labware selectors', () => {
    let state

    beforeEach(() => {
      state = makeState({
        session: {
          labwareBySlot: {
            1: {
              slot: '1',
              type: 's',
              isTiprack: true,
              calibratorMount: 'right'
            },
            2: {
              slot: '2',
              type: 'm',
              isTiprack: true,
              calibratorMount: 'left'
            },
            5: {slot: '5', type: 'a', isTiprack: false},
            9: {slot: '9', type: 'b', isTiprack: false}
          },
          pipettesByMount: {
            left: {name: 'p200', mount: 'left', channels: 8, volume: 200},
            right: {name: 'p50', mount: 'right', channels: 1, volume: 50}
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
          },
          calibrationRequest: {
            type: 'MOVE_TO',
            inProgress: true,
            slot: '1',
            mount: 'left'
          },
          probedByMount: {},
          tipOnByMount: {right: true}
        }
      })
    })

    test('get labware', () => {
      expect(getLabware(state)).toEqual([
        // multi channel tiprack should be first
        {
          slot: '2',
          type: 'm',
          isTiprack: true,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false,
          calibratorMount: 'left'
        },
        // then single channel tiprack
        {
          slot: '1',
          type: 's',
          isTiprack: true,
          isMoving: true,
          calibration: 'moving-to-slot',
          confirmed: false,
          calibratorMount: 'right'
        },
        // then other labware by slot
        {
          slot: '5',
          type: 'a',
          isTiprack: false,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: true
        },
        {
          slot: '9',
          type: 'b',
          isTiprack: false,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false
        }
      ])
    })

    test('get unconfirmed tipracks', () => {
      expect(getUnconfirmedTipracks(state)).toEqual([
        {
          slot: '2',
          type: 'm',
          isTiprack: true,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false,
          calibratorMount: 'left'
        },
        {
          slot: '1',
          type: 's',
          isTiprack: true,
          isMoving: true,
          calibration: 'moving-to-slot',
          confirmed: false,
          calibratorMount: 'right'
        }
      ])
    })

    test('get unconfirmed labware', () => {
      expect(getUnconfirmedLabware(state)).toEqual([
        {
          slot: '2',
          type: 'm',
          isTiprack: true,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false,
          calibratorMount: 'left'
        },
        {
          slot: '1',
          type: 's',
          isTiprack: true,
          isMoving: true,
          calibration: 'moving-to-slot',
          confirmed: false,
          calibratorMount: 'right'
        },
        {
          slot: '9',
          type: 'b',
          isTiprack: false,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false
        }
      ])
    })

    test('get next labware', () => {
      expect(getNextLabware(state)).toEqual({
        slot: '2',
        type: 'm',
        isTiprack: true,
        isMoving: false,
        calibration: 'unconfirmed',
        confirmed: false,
        calibratorMount: 'left'
      })

      const nextState = {
        [NAME]: {
          ...state[NAME],
          calibration: {
            ...state[NAME].calibration,
            confirmedBySlot: {
              ...state[NAME].calibration.confirmedBySlot,
              1: true,
              2: true
            }
          }
        }
      }

      expect(getNextLabware(nextState)).toEqual({
        slot: '9',
        type: 'b',
        isTiprack: false,
        isMoving: false,
        calibration: 'unconfirmed',
        confirmed: false
      })
    })
  })
})
