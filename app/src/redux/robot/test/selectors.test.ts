// robot selectors test
import { format } from 'date-fns'
import { setIn } from '@thi.ng/paths'
import { selectors, constants } from '../'

import * as protocolSelectors from '../../protocol/selectors'
import * as customLwSelectors from '../../custom-labware/selectors'

import type { State } from '../../types'
import type { RobotState } from '../reducer'
import type { SessionStatus } from '../types'

jest.mock('../../protocol/selectors')
jest.mock('../../custom-labware/selectors')

const makeState = (robotState: RobotState): State =>
  ({ robot: robotState } as any)

const getLabwareDefBySlot = protocolSelectors.getLabwareDefBySlot as jest.MockedFunction<
  typeof protocolSelectors.getLabwareDefBySlot
>
const getCustomLabwareDefinitions = customLwSelectors.getCustomLabwareDefinitions as jest.MockedFunction<
  typeof customLwSelectors.getCustomLabwareDefinitions
>

const getConnectedRobotName = selectors.getConnectedRobotName as jest.MockedFunction<
  typeof selectors.getConnectedRobotName
>
const getConnectionStatus = selectors.getConnectionStatus as jest.MockedFunction<
  typeof selectors.getConnectionStatus
>
const getSessionCapabilities = selectors.getSessionCapabilities as jest.MockedFunction<
  typeof selectors.getSessionCapabilities
>
const getSessionLoadInProgress = selectors.getSessionLoadInProgress as jest.MockedFunction<
  typeof selectors.getSessionLoadInProgress
>
const getUploadError = selectors.getUploadError as jest.MockedFunction<
  typeof selectors.getUploadError
>
const getSessionIsLoaded = selectors.getSessionIsLoaded as jest.MockedFunction<
  typeof selectors.getSessionIsLoaded
>
const getCommands = selectors.getCommands as jest.MockedFunction<
  typeof selectors.getCommands
>
const getRunProgress = selectors.getRunProgress as jest.MockedFunction<
  typeof selectors.getRunProgress
>
const getStartTime = selectors.getStartTime as jest.MockedFunction<
  typeof selectors.getStartTime
>
const getIsReadyToRun = selectors.getIsReadyToRun as jest.MockedFunction<
  typeof selectors.getIsReadyToRun
>
const getIsRunning = selectors.getIsRunning as jest.MockedFunction<
  typeof selectors.getIsRunning
>
const getIsPaused = selectors.getIsPaused as jest.MockedFunction<
  typeof selectors.getIsPaused
>
const getIsDone = selectors.getIsDone as jest.MockedFunction<
  typeof selectors.getIsDone
>
const getRunTime = selectors.getRunTime as jest.MockedFunction<
  typeof selectors.getRunTime
>
const getPipettes = selectors.getPipettes as jest.MockedFunction<
  typeof selectors.getPipettes
>
const getCalibratorMount = selectors.getCalibratorMount as jest.MockedFunction<
  typeof selectors.getCalibratorMount
>
const getPipettesCalibrated = selectors.getPipettesCalibrated as jest.MockedFunction<
  typeof selectors.getPipettesCalibrated
>
const getLabware = selectors.getLabware as jest.MockedFunction<
  typeof selectors.getLabware
>
const getUnconfirmedTipracks = selectors.getUnconfirmedTipracks as jest.MockedFunction<
  typeof selectors.getUnconfirmedTipracks
>
const getUnconfirmedLabware = selectors.getUnconfirmedLabware as jest.MockedFunction<
  typeof selectors.getUnconfirmedLabware
>
const getNextLabware = selectors.getNextLabware as jest.MockedFunction<
  typeof selectors.getNextLabware
>
const getTipracksByMount = selectors.getTipracksByMount as jest.MockedFunction<
  typeof selectors.getTipracksByMount
>
const getModulesBySlot = selectors.getModulesBySlot as jest.MockedFunction<
  typeof selectors.getModulesBySlot
>
const getModules = selectors.getModules as jest.MockedFunction<
  typeof selectors.getModules
>
const getDeckPopulated = selectors.getDeckPopulated as jest.MockedFunction<
  typeof selectors.getDeckPopulated
>

describe('robot selectors', () => {
  beforeEach(() => {
    getLabwareDefBySlot.mockReturnValue({})
    getCustomLabwareDefinitions.mockReturnValue([])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('robot list', () => {
    let state: State

    beforeEach(() => {
      state = {
        robot: { connection: { connectedTo: 'bar' } },
      } as any
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
    } as any)
    expect(getSessionCapabilities(state)).toEqual([
      'create',
      'create_from_bundle',
    ])
  })

  it('getSessionLoadInProgress', () => {
    let state = makeState({
      session: { sessionRequest: { inProgress: true } },
    } as any)
    expect(getSessionLoadInProgress(state)).toBe(true)

    state = makeState({
      session: { sessionRequest: { inProgress: false } },
    } as any)
    expect(getSessionLoadInProgress(state)).toBe(false)
  })

  it('getUploadError', () => {
    let state = makeState({
      session: { sessionRequest: { error: null } },
    } as any)
    expect(getUploadError(state)).toBe(null)

    state = makeState({
      session: { sessionRequest: { error: new Error('AH') } },
    } as any)
    expect(getUploadError(state)).toEqual(new Error('AH'))
  })

  it('getSessionIsLoaded', () => {
    let state = makeState({ session: { state: constants.LOADED } } as any)
    expect(getSessionIsLoaded(state)).toBe(true)

    state = makeState({ session: { state: '' } } as any)
    expect(getSessionIsLoaded(state)).toBe(false)
  })

  it('getIsReadyToRun', () => {
    const expectedStates: { [sessionStatus in SessionStatus]?: boolean } = {
      loaded: true,
      running: false,
      error: false,
      finished: false,
      stopped: false,
      paused: false,
    }

    Object.keys(expectedStates).forEach(sessionState => {
      const state = makeState({ session: { state: sessionState } } as any)
      const expected = expectedStates[sessionState as SessionStatus]

      expect(getIsReadyToRun(state)).toBe(expected)
    })
  })

  it('getIsRunning', () => {
    const expectedStates: { [sessionStatus in SessionStatus]?: boolean } = {
      loaded: false,
      running: true,
      error: false,
      finished: false,
      stopped: false,
      paused: true,
    }

    Object.keys(expectedStates).forEach(sessionState => {
      const state = makeState({ session: { state: sessionState } } as any)
      const expected = expectedStates[sessionState as SessionStatus]
      expect(getIsRunning(state)).toBe(expected)
    })
  })

  it('getIsPaused', () => {
    const expectedStates: { [sessionStatus in SessionStatus]?: boolean } = {
      loaded: false,
      running: false,
      error: false,
      finished: false,
      stopped: false,
      paused: true,
    }

    Object.keys(expectedStates).forEach(sessionState => {
      const state = makeState({ session: { state: sessionState } } as any)
      const expected = expectedStates[sessionState as SessionStatus]
      expect(getIsPaused(state)).toBe(expected)
    })
  })

  it('getIsDone', () => {
    const expectedStates: { [sessionStatus in SessionStatus]?: boolean } = {
      loaded: false,
      running: false,
      error: true,
      finished: true,
      stopped: true,
      paused: false,
    }

    Object.keys(expectedStates).forEach(sessionState => {
      const state = makeState({ session: { state: sessionState } } as any)
      const expected = expectedStates[sessionState as SessionStatus]
      expect(getIsDone(state)).toBe(expected)
    })
  })

  it('getStartTime with no start time returns null', () => {
    const state = makeState({
      session: { startTime: null },
    } as any)
    expect(getStartTime(state)).toBe(null)
  })

  it('getStartTime returns local formatted time', () => {
    const state = makeState({
      session: { startTime: 1582926000, remoteTimeCompensation: -6000 },
    } as any)
    expect(getStartTime(state)).toBe(format(1582920000, 'pp'))
  })

  it('getRunTime with no startTime', () => {
    const state: State = {
      robot: {
        session: {
          startTime: null,
          runTime: 42,
        },
      },
    } as any

    expect(getRunTime(state)).toEqual('00:00:00')
  })

  it('getRunTime with no remoteTimeCompensation', () => {
    const state: State = {
      robot: {
        session: {
          remoteTimeCompensation: null,
          startTime: 40,
          runTime: 42,
        },
      },
    } as any

    expect(getRunTime(state)).toEqual('00:00:00')
  })

  it('getRunTime', () => {
    const testGetRunTime = (seconds: number, expected: string): void => {
      const stateWithRunTime: State = {
        robot: {
          session: {
            remoteTimeCompensation: 0,
            startTime: 42,
            runTime: 42 + 1000 * seconds,
          },
        },
      } as any

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
    } as any)

    it('getRunProgress', () => {
      // leaves: 2, 3, 4; processed: 2
      expect(getRunProgress(state)).toEqual((1 / 3) * 100)
    })

    it('getRunProgress with no commands', () => {
      const state = makeState({
        session: { protocolCommands: [], protocolCommandsById: {} },
      } as any)

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
    let state: State

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
      } as any)
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
    } as any)

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
    } as any)

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
    } as any)

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
    } as any)

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
    } as any)

    expect(getPipettesCalibrated(twoPipettesCalibrated)).toBe(true)
    expect(getPipettesCalibrated(twoPipettesNotCalibrated)).toBe(false)
    expect(getPipettesCalibrated(onePipetteCalibrated)).toBe(true)
  })

  describe('module selectors', () => {
    let state: State

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
      } as any)
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
    let state: State

    beforeEach(() => {
      state = makeState({
        session: {
          labwareBySlot: {
            1: {
              slot: '1',
              type: 's',
              isTiprack: true,
              definitionHash: 'hash-1',
              calibratorMount: 'right',
            },
            2: {
              slot: '2',
              type: 'm',
              isTiprack: true,
              definitionHash: 'hash-2',
              calibratorMount: 'left',
            },
            3: {
              slot: '3',
              type: 's',
              isTiprack: true,
              definitionHash: 'hash-1',
              calibratorMount: 'left',
            },
            4: {
              slot: '4',
              type: 's',
              isTiprack: true,
              definitionHash: 'hash-1',
              calibratorMount: 'right',
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
      } as any)
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
          definitionHash: 'hash-2',
        },
        // then single channel tiprack
        {
          slot: '3',
          type: 's',
          isTiprack: true,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false,
          calibratorMount: 'left',
          definition: null,
          definitionHash: 'hash-1',
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
          definitionHash: 'hash-1',
        },

        {
          calibration: 'unconfirmed',
          calibratorMount: 'right',
          confirmed: false,
          definition: null,
          definitionHash: 'hash-1',
          isTiprack: true,
          isMoving: false,
          slot: '4',
          type: 's',
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
          definitionHash: 'hash-2',
        },
        // then single channel tiprack
        {
          slot: '3',
          type: 's',
          isTiprack: true,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false,
          calibratorMount: 'left',
          definition: null,
          definitionHash: 'hash-1',
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
          definitionHash: 'hash-1',
        },

        {
          calibration: 'unconfirmed',
          calibratorMount: 'right',
          confirmed: false,
          definition: null,
          definitionHash: 'hash-1',
          isTiprack: true,
          isMoving: false,
          slot: '4',
          type: 's',
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
          definitionHash: 'hash-2',
        },
        // then single channel tiprack
        {
          slot: '3',
          type: 's',
          isTiprack: true,
          isMoving: false,
          calibration: 'unconfirmed',
          confirmed: false,
          calibratorMount: 'left',
          definition: null,
          definitionHash: 'hash-1',
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
          definitionHash: 'hash-1',
        },

        {
          calibration: 'unconfirmed',
          calibratorMount: 'right',
          confirmed: false,
          definition: null,
          definitionHash: 'hash-1',
          isTiprack: true,
          isMoving: false,
          slot: '4',
          type: 's',
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
        definitionHash: 'hash-2',
        confirmed: false,
        calibratorMount: 'left',
        definition: null,
      })

      const nextState: State = {
        robot: {
          ...state.robot,
          calibration: {
            ...state.robot.calibration,
            confirmedBySlot: {
              ...state.robot.calibration.confirmedBySlot,
              1: true,
              2: true,
            },
          },
        },
      } as any

      expect(getNextLabware(nextState)).toEqual({
        slot: '3',
        calibratorMount: 'left',
        definitionHash: 'hash-1',
        type: 's',
        isTiprack: true,
        isMoving: false,
        calibration: 'unconfirmed',
        confirmed: false,
        definition: null,
      })
    })

    it('returns tipracks uniquely', () => {
      expect(getTipracksByMount(state)).toEqual({
        left: [
          {
            slot: '2',
            type: 'm',
            isTiprack: true,
            isMoving: false,
            calibration: 'unconfirmed',
            definitionHash: 'hash-2',
            confirmed: false,
            calibratorMount: 'left',
            definition: null,
          },
          {
            slot: '3',
            type: 's',
            isTiprack: true,
            isMoving: false,
            calibration: 'unconfirmed',
            confirmed: false,
            calibratorMount: 'left',
            definitionHash: 'hash-1',
            definition: null,
          },
        ],
        right: [
          {
            slot: '1',
            type: 's',
            isTiprack: true,
            isMoving: true,
            calibration: 'moving-to-slot',
            confirmed: false,
            calibratorMount: 'right',
            definition: null,
            definitionHash: 'hash-1',
          },
        ],
      })
    })

    it('uses tiprack lists from pipettes in getTipracksByMount if no calibratorMount', () => {
      state = makeState({
        session: {
          labwareBySlot: {
            1: {
              _id: 1,
              slot: '1',
              type: 's',
              definitionHash: 'hash-1',
              isTiprack: true,
              calibratorMount: 'right',
            },
            2: {
              _id: 2,
              slot: '2',
              type: 'm',
              isTiprack: true,
              definitionHash: 'hash-2',
              calibratorMount: 'right',
            },
          },
          pipettesByMount: {
            left: { name: 'p200', mount: 'left', tipRacks: [2] },
            right: { name: 'p50', mount: 'right', tipRacks: [1, 2] },
          },
        },
        calibration: {
          labwareBySlot: {},
          confirmedBySlot: {},
          calibrationRequest: { type: '', inProgress: false, error: null },
          probedByMount: {},
          tipOnByMount: {},
        },
      } as any)

      expect(getTipracksByMount(state)).toEqual({
        left: [
          {
            _id: 2,
            slot: '2',
            type: 'm',
            isTiprack: true,
            isMoving: false,
            calibration: 'unconfirmed',
            confirmed: false,
            calibratorMount: 'right',
            definition: null,
            definitionHash: 'hash-2',
          },
        ],
        right: [
          {
            _id: 1,
            slot: '1',
            type: 's',
            isTiprack: true,
            isMoving: false,
            definitionHash: 'hash-1',
            calibration: 'unconfirmed',
            confirmed: false,
            calibratorMount: 'right',
            definition: null,
          },
          {
            _id: 2,
            slot: '2',
            type: 'm',
            isTiprack: true,
            isMoving: false,
            calibration: 'unconfirmed',
            confirmed: false,
            calibratorMount: 'right',
            definition: null,
            definitionHash: 'hash-2',
          },
        ],
      })
    })
  })

  it('getDeckPopulated', () => {
    let state = makeState({ calibration: { deckPopulated: null } } as any)
    expect(getDeckPopulated(state)).toEqual(null)
    state = makeState({ calibration: { deckPopulated: false } } as any)
    expect(getDeckPopulated(state)).toEqual(false)
  })
})
