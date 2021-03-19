// @flow
import { TestScheduler } from 'rxjs/testing'

import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as PipettesSelectors from '../../../pipettes/selectors'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import * as Types from '../../types'
import { robotControlsEpic } from '..'

import type { Observable } from 'rxjs'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../../robot-api/types'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')
jest.mock('../../../pipettes/selectors')

const mockState = { state: true }

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

const mockGetAttachedPipettes: JestMockFn<[any, string], mixed> =
  PipettesSelectors.getAttachedPipettes

describe('moveEpic', () => {
  let testScheduler

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const meta = { requestId: '1234' }

  it('calls GET /robot/positions and then POST /robot/move with position: changePipette', () => {
    const action: Types.MoveAction = {
      ...Actions.move(mockRobot.name, 'changePipette', 'left'),
      meta,
    }

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveSuccess }))

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: mockState })
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRobotByName).toHaveBeenCalledWith(mockState, mockRobot.name)
      expect(mockFetchRobotApi).toHaveBeenNthCalledWith(1, mockRobot, {
        method: 'GET',
        path: '/robot/positions',
      })
      expect(mockFetchRobotApi).toHaveBeenNthCalledWith(2, mockRobot, {
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
      mockFetchRobotApi
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveSuccess }))

      mockGetAttachedPipettes.mockReturnValue({
        left: null,
        right: { model: 'p300_single_v2.0' },
      })

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: mockState })
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRobotByName).toHaveBeenCalledWith(mockState, mockRobot.name)
      expect(mockFetchRobotApi).toHaveBeenNthCalledWith(1, mockRobot, {
        method: 'GET',
        path: '/robot/positions',
      })
      expect(mockFetchRobotApi).toHaveBeenNthCalledWith(2, mockRobot, {
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
      mockFetchRobotApi
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveSuccess }))
        .mockReturnValueOnce(
          cold('d', { d: Fixtures.mockDisengageMotorsSuccess })
        )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: mockState })
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRobotByName).toHaveBeenCalledWith(mockState, mockRobot.name)
      expect(mockFetchRobotApi).toHaveBeenNthCalledWith(3, mockRobot, {
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
      mockFetchRobotApi
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveSuccess }))
        .mockReturnValueOnce(
          cold('d', { d: Fixtures.mockDisengageMotorsSuccess })
        )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
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
      mockFetchRobotApi
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveSuccess }))
        .mockReturnValueOnce(
          cold('d', { d: Fixtures.mockDisengageMotorsSuccess })
        )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
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
      mockFetchRobotApi.mockReturnValueOnce(
        cold('r', { r: Fixtures.mockFetchPositionsFailure })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
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
      mockFetchRobotApi
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveFailure }))

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
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
      mockFetchRobotApi
        .mockReturnValueOnce(
          cold('p', { p: Fixtures.mockFetchPositionsSuccess })
        )
        .mockReturnValueOnce(cold('m', { m: Fixtures.mockMoveSuccess }))
        .mockReturnValueOnce(
          cold('d', { d: Fixtures.mockDisengageMotorsFailure })
        )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
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
