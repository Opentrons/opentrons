import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'

import * as Actions from '../../actions'
import * as Types from '../../types'
import { pipettesEpic } from '../../epic'

import type { Action, State } from '../../../types'
import type { RobotApiRequestMeta } from '../../../robot-api/types'

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

describe('fetchPipetteSettingsEpic', () => {
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

  describe('handles FETCH_PIPETTE_SETTINGS', () => {
    const meta: RobotApiRequestMeta = { requestId: '1234' } as any
    const action: Types.FetchPipetteSettingsAction = {
      ...Actions.fetchPipetteSettings(mockRobot.name),
      meta,
    }

    it('calls GET /settings/pipettes', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockFetchPipetteSettingsSuccess })
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
          path: '/settings/pipettes',
        })
      })
    })

    it('maps successful response to FETCH_PIPETTE_SETTINGS_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockFetchPipetteSettingsSuccess })
        )

        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('a-a', { a: {} } as any)
        const output$ = pipettesEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchPipetteSettingsSuccess(
            mockRobot.name,
            Fixtures.mockFetchPipetteSettingsSuccess.body,
            { ...meta, response: Fixtures.mockFetchPipetteSettingsSuccessMeta }
          ),
        })
      })
    })

    it('maps failed response to FETCH_PIPETTE_SETTINGS_FAILURE', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockFetchPipetteSettingsFailure })
        )

        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('a-a', { a: {} } as any)
        const output$ = pipettesEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchPipetteSettingsFailure(
            mockRobot.name,
            { message: 'AH' },
            { ...meta, response: Fixtures.mockFetchPipetteSettingsFailureMeta }
          ),
        })
      })
    })
  })
})
