// robot selectors test
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
      expect(selectors.getConnectedRobotName(state)).toEqual('bar')
      state = setIn(state, 'robot.connection.connectedTo', 'foo')
      expect(selectors.getConnectedRobotName(state)).toEqual('foo')
    })

    it('getConnectionStatus', () => {
      state = setIn(state, 'robot.connection', {
        connectedTo: '',
        connectRequest: { inProgress: false },
        disconnectRequest: { inProgress: false },
      })
      expect(selectors.getConnectionStatus(state)).toBe(constants.DISCONNECTED)

      state = setIn(state, 'robot.connection', {
        connectedTo: '',
        connectRequest: { inProgress: true },
        disconnectRequest: { inProgress: false },
      })
      expect(selectors.getConnectionStatus(state)).toBe(constants.CONNECTING)

      state = setIn(state, 'robot.connection', {
        connectedTo: 'foo',
        connectRequest: { inProgress: false },
        disconnectRequest: { inProgress: false },
      })
      expect(selectors.getConnectionStatus(state)).toBe(constants.CONNECTED)

      state = setIn(state, 'robot.connection', {
        connectedTo: 'foo',
        connectRequest: { inProgress: false },
        disconnectRequest: { inProgress: true },
      })
      expect(selectors.getConnectionStatus(state)).toBe(constants.DISCONNECTING)
    })
  })

  it('getSessionCapabilities', () => {
    const state = makeState({
      session: { capabilities: ['create', 'create_from_bundle'] },
    } as any)
    expect(selectors.getSessionCapabilities(state)).toEqual([
      'create',
      'create_from_bundle',
    ])
  })

  it('getSessionLoadInProgress', () => {
    let state = makeState({
      session: { sessionRequest: { inProgress: true } },
    } as any)
    expect(selectors.getSessionLoadInProgress(state)).toBe(true)

    state = makeState({
      session: { sessionRequest: { inProgress: false } },
    } as any)
    expect(selectors.getSessionLoadInProgress(state)).toBe(false)
  })

  it('getUploadError', () => {
    let state = makeState({
      session: { sessionRequest: { error: null } },
    } as any)
    expect(selectors.getUploadError(state)).toBe(null)

    state = makeState({
      session: { sessionRequest: { error: new Error('AH') } },
    } as any)
    expect(selectors.getUploadError(state)).toEqual(new Error('AH'))
  })

  it('getSessionIsLoaded', () => {
    let state = makeState({ session: { state: constants.LOADED } } as any)
    expect(selectors.getSessionIsLoaded(state)).toBe(true)

    state = makeState({ session: { state: '' } } as any)
    expect(selectors.getSessionIsLoaded(state)).toBe(false)
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

      expect(selectors.getIsReadyToRun(state)).toBe(expected)
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
      expect(selectors.getIsRunning(state)).toBe(expected)
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
      expect(selectors.getIsPaused(state)).toBe(expected)
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
      expect(selectors.getIsDone(state)).toBe(expected)
    })
  })

  it('getStartTimeMs with no start time returns null', () => {
    const state = makeState({
      session: { startTime: null },
    } as any)
    expect(selectors.getStartTimeMs(state)).toBeNull()
  })

  it('getStartTimeMs returns non-null value if startTime exists', () => {
    const state = makeState({
      session: { startTime: 1582926000 },
    } as any)
    expect(selectors.getStartTimeMs(state)).toBe(1582926000)
  })

  describe('getRunSeconds', function () {
    const now = Date.now()
    const getRunSecondsTests: Array<{
      changedAt?: number
      expected: number
      startTime?: number
      state: SessionStatus
      text: string
    }> = [
      {
        expected: 0,
        state: '',
        text: 'should return 0 if in unloaded state',
      },
      {
        expected: 0,
        state: 'running',
        text: 'should return 0 if running but startTime = null',
      },
      {
        expected: 10,
        startTime: now - 1000 * 10,
        state: 'running',
        text: 'should return proper offset if running and startTime != null',
      },
      {
        expected: 10,
        startTime: now - 1010 * 10,
        state: 'running',
        text: 'should properly floor the startTime',
      },
      {
        expected: 0,
        state: 'finished',
        text: 'should return 0 if done but changedAt is null',
      },
      {
        changedAt: 1000 * 10,
        expected: 10,
        state: 'finished',
        text: 'should return proper offset if finished and changedAt != null',
      },
      {
        changedAt: 1010 * 10,
        expected: 10,
        startTime: now - 1010 * 10,
        state: 'finished',
        text: 'should properly floor changedAt',
      },
    ]
    getRunSecondsTests.forEach(test => {
      it(test.text, function () {
        const state = makeState({
          session: {
            statusInfo: {
              changedAt: test.changedAt,
            },
            startTime: test.startTime,
            state: test.state,
          },
        } as any)
        expect(selectors.getRunSeconds(state, now)).toBe(test.expected)
      })
    })
  })

  it('getPausedSeconds should return 0 if not paused', function () {
    const state = makeState({
      session: {
        state: '',
      },
    } as any)
    expect(selectors.getPausedSeconds(state)).toBe(0)
  })

  it('getPausedSeconds should return 0 if startTime is null', function () {
    const state = makeState({
      session: {
        state: 'paused',
      },
    } as any)
    expect(selectors.getPausedSeconds(state)).toBe(0)
  })

  it('getPausedSeconds should return 0 if changedAt is null', function () {
    const state = makeState({
      session: {
        state: 'paused',
      },
      startTime: Date.now(),
    } as any)
    expect(selectors.getPausedSeconds(state)).toBe(0)
  })

  it('getPausedSeconds should properly compute paused seconds if paused', function () {
    const now = Date.now()
    const state = makeState({
      session: {
        startTime: now - 1000 * 10,
        state: 'paused',
        statusInfo: {
          changedAt: 1000 * 5,
        },
      },
    } as any)
    expect(selectors.getPausedSeconds(state, now)).toBe(5)
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
      expect(selectors.getRunProgress(state)).toEqual((1 / 3) * 100)
    })

    it('getRunProgress with no commands', () => {
      const state = makeState({
        session: { protocolCommands: [], protocolCommandsById: {} },
      } as any)

      expect(selectors.getRunProgress(state)).toEqual(0)
    })

    it('getCommands', () => {
      expect(selectors.getCommands(state)).toEqual([
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
      expect(selectors.getPipettes(state)).toEqual([
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

    expect(selectors.getCalibratorMount(leftState)).toBe('left')
    expect(selectors.getCalibratorMount(rightState)).toBe('right')
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

    expect(selectors.getPipettesCalibrated(twoPipettesCalibrated)).toBe(true)
    expect(selectors.getPipettesCalibrated(twoPipettesNotCalibrated)).toBe(
      false
    )
    expect(selectors.getPipettesCalibrated(onePipetteCalibrated)).toBe(true)
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
      expect(selectors.getModulesBySlot(state)).toEqual({
        1: {
          _id: 1,
          slot: '1',
          name: 'tempdeck',
        },
      })
    })

    it('get modules', () => {
      expect(selectors.getModules(state)).toEqual([
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
      expect(selectors.getLabware(state)).toEqual([
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
      expect(selectors.getUnconfirmedTipracks(state)).toEqual([
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
      expect(selectors.getUnconfirmedLabware(state)).toEqual([
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
      expect(selectors.getNextLabware(state)).toEqual({
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

      expect(selectors.getNextLabware(nextState)).toEqual({
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
      expect(selectors.getTipracksByMount(state)).toEqual({
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

      expect(selectors.getTipracksByMount(state)).toEqual({
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
    expect(selectors.getDeckPopulated(state)).toEqual(null)
    state = makeState({ calibration: { deckPopulated: false } } as any)
    expect(selectors.getDeckPopulated(state)).toEqual(false)
  })
})
