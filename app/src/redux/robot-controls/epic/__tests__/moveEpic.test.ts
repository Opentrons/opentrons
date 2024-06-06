import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestScheduler } from 'rxjs/testing'

import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as PipettesSelectors from '../../../pipettes/selectors'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { robotControlsEpic } from '..'

import type * as Types from '../../types'
import type { Action, State } from '../../../types'

vi.mock('../../../robot-api/http')
vi.mock('../../../discovery/selectors')
vi.mock('../../../pipettes/selectors')

const mockState: State = { state: true } as any

describe('moveEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    vi.mocked(DiscoverySelectors.getRobotByName).mockReturnValue(
      mockRobot as any
    )

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const meta = { requestId: '1234' }

  it('calls GET /robot/positions and then POST /robot/move with position: changePipette', () => {
    const action: Types.MoveAction = {
      ...Actions.move(mockRobot.name, 'changePipette', 'left'),
      meta,
    }

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi)
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveSuccess }))

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: mockState })
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(DiscoverySelectors.getRobotByName).toHaveBeenCalledWith(
        mockState,
        mockRobot.name
      )
      expect(RobotApiHttp.fetchRobotApi).toHaveBeenNthCalledWith(1, mockRobot, {
        method: 'GET',
        path: '/robot/positions',
      })
      expect(RobotApiHttp.fetchRobotApi).toHaveBeenNthCalledWith(2, mockRobot, {
        method: 'POST',
        path: '/robot/move',
        body: {
          target: 'mount',
          mount: 'left',
          point: Fixtures.mockPositions.change_pipette.left,
        },
      })
    })
  })

  it('calls GET /robot/positions and POST /robot/move with position: attachTip', () => {
    const action: Types.MoveAction = {
      ...Actions.move(mockRobot.name, 'attachTip', 'right'),
      meta,
    }

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi)
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveSuccess }))

      vi.mocked(PipettesSelectors.getAttachedPipettes).mockReturnValue({
        left: null,
        right: { model: 'p300_single_v2.0' } as any,
      })

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: mockState })
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(DiscoverySelectors.getRobotByName).toHaveBeenCalledWith(
        mockState,
        mockRobot.name
      )
      expect(RobotApiHttp.fetchRobotApi).toHaveBeenNthCalledWith(1, mockRobot, {
        method: 'GET',
        path: '/robot/positions',
      })
      expect(RobotApiHttp.fetchRobotApi).toHaveBeenNthCalledWith(2, mockRobot, {
        method: 'POST',
        path: '/robot/move',
        body: {
          target: 'pipette',
          model: 'p300_single_v2.0',
          mount: 'right',
          point: Fixtures.mockPositions.attach_tip.point,
        },
      })
    })
  })

  it('calls POST /motors/disengage if disengageMotors: true', () => {
    const action: Types.MoveAction = {
      ...Actions.move(mockRobot.name, 'changePipette', 'left', true),
      meta,
    }

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi)
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveSuccess }))
        .mockReturnValueOnce(
          cold('d', { d: Fixtures.mockDisengageMotorsSuccess })
        )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: mockState })
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(DiscoverySelectors.getRobotByName).toHaveBeenCalledWith(
        mockState,
        mockRobot.name
      )
      expect(RobotApiHttp.fetchRobotApi).toHaveBeenNthCalledWith(3, mockRobot, {
        method: 'POST',
        path: '/motors/disengage',
        body: { axes: ['a', 'b', 'c', 'z'] },
      })
    })
  })

  it('maps successful response to MOVE_SUCCESS without disengage', () => {
    const action: Types.MoveAction = {
      ...Actions.move(mockRobot.name, 'changePipette', 'left'),
      meta,
    }

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi)
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveSuccess }))
        .mockReturnValueOnce(
          cold('d', { d: Fixtures.mockDisengageMotorsSuccess })
        )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.moveSuccess(mockRobot.name, {
          ...meta,
          response: Fixtures.mockMoveSuccessMeta,
        }),
      })
    })
  })

  it('maps successful response to MOVE_SUCCESS with disengage', () => {
    const action: Types.MoveAction = {
      ...Actions.move(mockRobot.name, 'changePipette', 'left', true),
      meta,
    }

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi)
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveSuccess }))
        .mockReturnValueOnce(
          cold('d', { d: Fixtures.mockDisengageMotorsSuccess })
        )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.moveSuccess(mockRobot.name, {
          ...meta,
          response: Fixtures.mockMoveSuccessMeta,
        }),
      })
    })
  })

  it('maps failed GET /robot/positions to MOVE_FAILURE', () => {
    const action: Types.MoveAction = {
      ...Actions.move(mockRobot.name, 'changePipette', 'left', true),
      meta,
    }

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValueOnce(
        cold('r', { r: Fixtures.mockFetchPositionsFailure })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.moveFailure(
          mockRobot.name,
          { message: 'AH' },
          { ...meta, response: Fixtures.mockFetchPositionsFailureMeta }
        ),
      })
    })
  })

  it('maps failed POST /robot/move to MOVE_FAILURE', () => {
    const action: Types.MoveAction = {
      ...Actions.move(mockRobot.name, 'changePipette', 'left', true),
      meta,
    }

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi)
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveFailure }))

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.moveFailure(
          mockRobot.name,
          { message: 'AH' },
          { ...meta, response: Fixtures.mockMoveFailureMeta }
        ),
      })
    })
  })

  it('maps failed POST /motors/disengage to MOVE_FAILURE', () => {
    const action: Types.MoveAction = {
      ...Actions.move(mockRobot.name, 'changePipette', 'left', true),
      meta,
    }

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi)
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveSuccess }))
        .mockReturnValueOnce(
          cold('d', { d: Fixtures.mockDisengageMotorsFailure })
        )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.moveFailure(
          mockRobot.name,
          { message: 'AH' },
          { ...meta, response: Fixtures.mockDisengageMotorsFailureMeta }
        ),
      })
    })
  })
})
