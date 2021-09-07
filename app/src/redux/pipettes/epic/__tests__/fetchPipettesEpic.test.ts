import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'

import * as Actions from '../../actions'
import * as Types from '../../types'
import { pipettesEpic } from '../../epic'

import type { Action, State } from '../../../types'
import type { RobotApiResponse } from '../../../robot-api/types'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')

const mockState: State = { state: true } as any
const { mockRobot } = Fixtures

const mockFetchRobotApi = RobotApiHttp.fetchRobotApi as jest.MockedFunction<
  typeof RobotApiHttp.fetchRobotApi
>

const mockGetRobotByName = DiscoverySelectors.getRobotByName as jest.MockedFunction<
  typeof DiscoverySelectors.getRobotByName
>

describe('fetchPipettesEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot as any)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('handles FETCH_PIPETTES', () => {
    const meta = { requestId: '1234' } as any
    const action: Types.FetchPipettesAction = {
      ...Actions.fetchPipettes(mockRobot.name, true),
      meta,
    }

    it('calls GET /pipettes', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold<RobotApiResponse>('r', { r: Fixtures.mockFetchPipettesSuccess })
        )

        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('a-a', { a: mockState })
        const output$ = pipettesEpic(action$, state$)

        expectObservable(output$)
        flush()

        expect(mockGetRobotByName).toHaveBeenCalledWith(
          mockState,
          mockRobot.name
        )
        expect(mockFetchRobotApi).toHaveBeenCalledWith(mockRobot, {
          method: 'GET',
          path: '/pipettes',
          query: { refresh: true },
        })
      })
    })

    it('maps successful response to FETCH_PIPETTES_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockFetchPipettesSuccess })
        )

        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('a-a', { a: {} } as any)
        const output$ = pipettesEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchPipettesSuccess(
            mockRobot.name,
            Fixtures.mockFetchPipettesSuccess.body,
            { ...meta, response: Fixtures.mockFetchPipettesSuccessMeta }
          ),
        })
      })
    })

    it('maps failed response to FETCH_PIPETTES_FAILURE', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockFetchPipettesFailure })
        )

        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('a-a', { a: {} } as any)
        const output$ = pipettesEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchPipettesFailure(
            mockRobot.name,
            { message: 'AH' },
            { ...meta, response: Fixtures.mockFetchPipettesFailureMeta }
          ),
        })
      })
    })
  })
})
