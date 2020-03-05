// robot selectors test
import { format } from 'date-fns'
import { setIn } from '@thi.ng/paths'
import { NAME, selectors, constants } from '../'

import { getLabwareDefBySlot } from '../../protocol/selectors'
import { getCustomLabwareDefinitions } from '../../custom-labware/selectors'

jest.mock('../../protocol/selectors')
jest.mock('../../custom-labware/selectors')

const makeState = state => ({ [NAME]: state })

const {
  getConnectedRobotName,
  getConnectionStatus,
  getSessionCapabilities,
  getSessionLoadInProgress,
  getUploadError,
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
  getTipracksByMount,
  getModulesBySlot,
  getModules,
  getDeckPopulated,
} = selectors

describe('robot selectors', () => {
  beforeEach(() => {
    getLabwareDefBySlot.mockReturnValue({})
    getCustomLabwareDefinitions.mockReturnValue([])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('robot list', () => {
    let state

    beforeEach(() => {
      state = {
        robot: { connection: { connectedTo: 'bar' } },
      }
    })

    it('getConnectedRobotName', () => {
      expect(getConnectedRobotName(state)).toEqual('bar')
      state = setIn(state, 'robot.connection.connectedTo', 'foo')
      expect(getConnectedRobotName(state)).toEqual('foo')
    })

    it('getConnectionStatus', () => {
      state = setIn(state, 'robot.connection', {
        connectedTo: '',
        connectRequest: { inProgress: false },
        disconnectRequest: { inProgress: false },
      })
      expect(getConnectionStatus(state)).toBe(constants.DISCONNECTED)

      state = setIn(state, 'robot.connection', {
        connectedTo: '',
        connectRequest: { inProgress: true },
        disconnectRequest: { inProgress: false },
      })
      expect(getConnectionStatus(state)).toBe(constants.CONNECTING)

      state = setIn(state, 'robot.connection', {
        connectedTo: 'foo',
        connectRequest: { inProgress: false },
        disconnectRequest: { inProgress: false },
      })
      expect(getConnectionStatus(state)).toBe(constants.CONNECTED)

      state = setIn(state, 'robot.connection', {
        connectedTo: 'foo',
        connectRequest: { inProgress: false },
        disconnectRequest: { inProgress: true },
      })
      expect(getConnectionStatus(state)).toBe(constants.DISCONNECTING)
    })
  })

  it('getSessionCapabilities', () => {
    const state = makeState({
      session: { capabilities: ['create', 'create_from_bundle'] },
    })
    expect(getSessionCapabilities(state)).toEqual([
      'create',
      'create_from_bundle',
    ])
  })

  it('getSessionLoadInProgress', () => {
    let state = makeState({ session: { sessionRequest: { inProgress: true } } })
    expect(getSessionLoadInProgress(state)).toBe(true)

    state = makeState({ session: { sessionRequest: { inProgress: false } } })
    expect(getSessionLoadInProgress(state)).toBe(false)
  })

  it('getUploadError', () => {
    let state = makeState({ session: { sessionRequest: { error: null } } })
    expect(getUploadError(state)).toBe(null)

    state = makeState({
      session: { sessionRequest: { error: new Error('AH') } },
    })
    expect(getUploadError(state)).toEqual(new Error('AH'))
  })

  it('getSessionIsLoaded', () => {
    let state = makeState({ session: { state: constants.LOADED } })
    expect(getSessionIsLoaded(state)).toBe(true)

    state = makeState({ session: { state: '' } })
    expect(getSessionIsLoaded(state)).toBe(false)
  })

  it('getIsReadyToRun', () => {
    const expectedStates = {
      loaded: true,
      running: false,
      error: false,
      finished: false,
      stopped: false,
      paused: false,
    }

    Object.keys(expectedStates).forEach(sessionState => {
      const state = makeState({ session: { state: sessionState } })
      const expected = expectedStates[sessionState]

      expect(getIsReadyToRun(state)).toBe(expected)
    })
  })

  it('getIsRunning', () => {
    const expectedStates = {
      loaded: false,
      running: true,
      error: false,
      finished: false,
      stopped: false,
      paused: true,
    }

    Object.keys(expectedStates).forEach(sessionState => {
      const state = makeState({ session: { state: sessionState } })
      const expected = expectedStates[sessionState]
      expect(getIsRunning(state)).toBe(expected)
    })
  })

  it('getIsPaused', () => {
    const expectedStates = {
      loaded: false,
      running: false,
      error: false,
      finished: false,
      stopped: false,
      paused: true,
    }

    Object.keys(expectedStates).forEach(sessionState => {
      const state = makeState({ session: { state: sessionState } })
      const expected = expectedStates[sessionState]
      expect(getIsPaused(state)).toBe(expected)
    })
  })

  it('getIsDone', () => {
    const expectedStates = {
      loaded: false,
      running: false,
      error: true,
      finished: true,
      stopped: true,
      paused: false,
    }

    Object.keys(expectedStates).forEach(sessionState => {
      const state = makeState({ session: { state: sessionState } })
      const expected = expectedStates[sessionState]
      expect(getIsDone(state)).toBe(expected)
    })
  })

  it('getStartTime with no start time returns null', () => {
    const state = makeState({
      session: { startTime: null },
    })
    expect(getStartTime(state)).toBe(null)
  })

  it('getStartTime returns local formatted time', () => {
    const state = makeState({
      session: { startTime: 1582926000, remoteTimeCompensation: -6000 },
    })
    expect(getStartTime(state)).toBe(format(1582920000, 'pp'))
  })

  it('getRunTime with no startTime', () => {
    const state = {
      [NAME]: {
        session: {
          startTime: null,
          runTime: 42,
        },
      },
    }

    expect(getRunTime(state)).toEqual('00:00:00')
  })

  it('getRunTime with no remoteTimeCompensation', () => {
    const state = {
      [NAME]: {
        session: {
          remoteTimeCompensation: null,
          startTime: 40,
          runTime: 42,
        },
      },
    }

    expect(getRunTime(state)).toEqual('00:00:00')
  })

  it('getRunTime', () => {
    const testGetRunTime = (seconds, expected) => {
      const stateWithRunTime = {
        [NAME]: {
          session: {
            remoteTimeCompensation: 0,
            startTime: 42,
            runTime: 42 + 1000 * seconds,
          },
        },
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
            children: [1],
          },
          1: {
            id: 1,
            description: 'bar',
            handledAt: 43,
            children: [2, 3],
          },
          2: {
            id: 2,
            description: 'baz',
            handledAt: 44,
            children: [],
          },
          3: {
            id: 3,
            description: 'qux',
            handledAt: null,
            children: [],
          },
          4: {
            id: 4,
            description: 'fizzbuzz',
            handledAt: null,
            children: [],
          },
        },
      },
    })

    it('getRunProgress', () => {
      // leaves: 2, 3, 4; processed: 2
      expect(getRunProgress(state)).toEqual((1 / 3) * 100)
    })

    it('getRunProgress with no commands', () => {
      const state = makeState({
        session: { protocolCommands: [], protocolCommandsById: {} },
      })

      expect(getRunProgress(state)).toEqual(0)
    })

    it('getCommands', () => {
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
                  children: [],
                },
                {
                  id: 3,
                  description: 'qux',
                  handledAt: null,
                  isCurrent: false,
                  isLast: false,
                  children: [],
                },
              ],
            },
          ],
        },
        {
          id: 4,
          description: 'fizzbuzz',
          handledAt: null,
          isCurrent: false,
          isLast: false,
          children: [],
        },
      ])
    })
  })

  describe('instrument selectors', () => {
    let state

    beforeEach(() => {
      state = makeState({
        session: {
          pipettesByMount: {
            left: { mount: 'left', name: 'p200m', channels: 8, volume: 200 },
            right: { mount: 'right', name: 'p50s', channels: 1, volume: 50 },
          },
        },
        calibration: {
          probedByMount: {
            left: true,
          },
          tipOnByMount: {
            right: true,
          },
        },
      })
    })

    // TODO(mc: 2018-01-10): rethink the instrument level "calibration" prop
    it('get pipettes', () => {
      expect(getPipettes(state)).toEqual([
        {
          mount: 'left',
          name: 'p200m',
          channels: 8,
          volume: 200,
          probed: true,
          tipOn: false,
          modelSpecs: null,
          requestedAs: null,
        },
        {
          mount: 'right',
          name: 'p50s',
          channels: 1,
          volume: 50,
          probed: false,
          tipOn: true,
          modelSpecs: null,
          requestedAs: null,
        },
      ])
    })
  })

  it('get calibrator mount', () => {
    const leftState = makeState({
      session: {
        pipettesByMount: {
          left: { mount: 'left', name: 'p200m', channels: 8, volume: 200 },
          right: { mount: 'right', name: 'p50s', channels: 1, volume: 50 },
        },
      },
      calibration: {
        calibrationRequest: {},
        probedByMount: {},
        tipOnByMount: { left: true },
      },
    })

    const rightState = makeState({
      session: {
        pipettesByMount: {
          left: { mount: 'left', name: 'p200m', channels: 8, volume: 200 },
          right: { mount: 'right', name: 'p50s', channels: 1, volume: 50 },
        },
      },
      calibration: {
        calibrationRequest: {},
        probedByMount: {},
        tipOnByMount: { right: true },
      },
    })

    expect(getCalibratorMount(leftState)).toBe('left')
    expect(getCalibratorMount(rightState)).toBe('right')
  })

  it('get instruments are calibrated', () => {
    const twoPipettesCalibrated = makeState({
      session: {
        pipettesByMount: {
          left: { name: 'p200', mount: 'left', channels: 8, volume: 200 },
          right: { name: 'p50', mount: 'right', channels: 1, volume: 50 },
        },
      },
      calibration: {
        calibrationRequest: {},
        probedByMount: { left: true, right: true },
        tipOnByMount: {},
      },
    })

    const twoPipettesNotCalibrated = makeState({
      session: {
        pipettesByMount: {
          left: { name: 'p200', mount: 'left', channels: 8, volume: 200 },
          right: { name: 'p50', mount: 'right', channels: 1, volume: 50 },
        },
      },
      calibration: {
        calibrationRequest: {},
        probedByMount: { left: false, right: false },
        tipOnByMount: {},
      },
    })

    const onePipetteCalibrated = makeState({
      session: {
        pipettesByMount: {
          right: { name: 'p50', mount: 'right', channels: 1, volume: 50 },
        },
      },
      calibration: {
        calibrationRequest: {},
        probedByMount: { right: true },
        tipOnByMount: {},
      },
    })

    expect(getPipettesCalibrated(twoPipettesCalibrated)).toBe(true)
    expect(getPipettesCalibrated(twoPipettesNotCalibrated)).toBe(false)
    expect(getPipettesCalibrated(onePipetteCalibrated)).toBe(true)
  })

  describe('module selectors', () => {
    let state

    beforeEach(() => {
      state = makeState({
        session: {
          modulesBySlot: {
            1: {
              _id: 1,
              slot: '1',
              name: 'tempdeck',
            },
          },
        },
      })
    })

    it('get modules by slot', () => {
      expect(getModulesBySlot(state)).toEqual({
        1: {
          _id: 1,
          slot: '1',
          name: 'tempdeck',
        },
      })
    })

    it('get modules', () => {
      expect(getModules(state)).toEqual([
        {
          _id: 1,
          slot: '1',
          name: 'tempdeck',
        },
      ])
    })
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
              calibratorMount: 'right',
            },
            2: {
              slot: '2',
              type: 'm',
              isTiprack: true,
              calibratorMount: 'left',
            },
            5: { slot: '5', type: 'a', isTiprack: false },
            7: { slot: '7', type: 'a', isTiprack: false },
            9: { slot: '9', type: 'b', isTiprack: false },
          },
          modulesBySlot: {
            1: {
              _id: 1,
              slot: '1',
              name: 'tempdeck',
            },
          },
          pipettesByMount: {
            left: { name: 'p200', mount: 'left', channels: 8, volume: 200 },
            right: { name: 'p50', mount: 'right', channels: 1, volume: 50 },
          },
        },
        calibration: {
          labwareBySlot: {
            1: constants.UNCONFIRMED,
            5: constants.OVER_SLOT,
          },
          confirmedBySlot: {
            1: false,
            5: true,
          },
          calibrationRequest: {
            type: 'MOVE_TO',
            inProgress: true,
            slot: '1',
            mount: 'left',
          },
          probedByMount: {},
          tipOnByMount: { right: true },
        },
      })
    })

    it('get labware', () => {
      expect(getLabware(state)).toEqual([
        // multi channel tiprack should be first
        {
          slot: '2',
          type: 'm',
          isTiprack: true,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false,
          calibratorMount: 'left',
          definition: null,
        },
        // then single channel tiprack
        {
          slot: '1',
          type: 's',
          isTiprack: true,
          isMoving: true,
          calibration: 'moving-to-slot',
          confirmed: false,
          calibratorMount: 'right',
          definition: null,
        },
        // then other labware by slot
        {
          slot: '5',
          type: 'a',
          isTiprack: false,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: true,
          definition: null,
        },
        // then other labware by slot
        {
          slot: '7',
          type: 'a',
          isTiprack: false,
          isMoving: false,
          calibration: 'unconfirmed',
          // note: labware a in slot 7 is confirmed because confirmed in slot 5
          confirmed: true,
          definition: null,
        },
        {
          slot: '9',
          type: 'b',
          isTiprack: false,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false,
          definition: null,
        },
      ])
    })

    it('get unconfirmed tipracks', () => {
      expect(getUnconfirmedTipracks(state)).toEqual([
        {
          slot: '2',
          type: 'm',
          isTiprack: true,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false,
          calibratorMount: 'left',
          definition: null,
        },
        {
          slot: '1',
          type: 's',
          isTiprack: true,
          isMoving: true,
          calibration: 'moving-to-slot',
          confirmed: false,
          calibratorMount: 'right',
          definition: null,
        },
      ])
    })

    it('get unconfirmed labware', () => {
      expect(getUnconfirmedLabware(state)).toEqual([
        {
          slot: '2',
          type: 'm',
          isTiprack: true,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false,
          calibratorMount: 'left',
          definition: null,
        },
        {
          slot: '1',
          type: 's',
          isTiprack: true,
          isMoving: true,
          calibration: 'moving-to-slot',
          confirmed: false,
          calibratorMount: 'right',
          definition: null,
        },
        {
          slot: '9',
          type: 'b',
          isTiprack: false,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false,
          definition: null,
        },
      ])
    })

    it('get next labware', () => {
      expect(getNextLabware(state)).toEqual({
        slot: '2',
        type: 'm',
        isTiprack: true,
        isMoving: false,
        calibration: 'unconfirmed',
        confirmed: false,
        calibratorMount: 'left',
        definition: null,
      })

      const nextState = {
        [NAME]: {
          ...state[NAME],
          calibration: {
            ...state[NAME].calibration,
            confirmedBySlot: {
              ...state[NAME].calibration.confirmedBySlot,
              1: true,
              2: true,
            },
          },
        },
      }

      expect(getNextLabware(nextState)).toEqual({
        slot: '9',
        type: 'b',
        isTiprack: false,
        isMoving: false,
        calibration: 'unconfirmed',
        confirmed: false,
        definition: null,
      })
    })

    it('getTipracksByMount', () => {
      expect(getTipracksByMount(state)).toEqual({
        left: {
          slot: '2',
          type: 'm',
          isTiprack: true,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false,
          calibratorMount: 'left',
          definition: null,
        },
        right: {
          slot: '1',
          type: 's',
          isTiprack: true,
          isMoving: true,
          calibration: 'moving-to-slot',
          confirmed: false,
          calibratorMount: 'right',
          definition: null,
        },
      })
    })
  })

  it('getDeckPopulated', () => {
    let state = makeState({ calibration: { deckPopulated: null } })
    expect(getDeckPopulated(state)).toEqual(null)
    state = makeState({ calibration: { deckPopulated: false } })
    expect(getDeckPopulated(state)).toEqual(false)
  })
})
