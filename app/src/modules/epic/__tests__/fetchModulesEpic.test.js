// @flow
import type { Observable } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'

import * as Fixtures from '../../__fixtures__'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as RobotApiHttp from '../../../robot-api/http'
import type {
  RobotApiRequestOptions,
  RobotApiResponse,
  RobotHost,
} from '../../../robot-api/types'
import * as Actions from '../../actions'
import { modulesEpic } from '../../epic'
import * as Types from '../../types'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')

const mockState = { state: true }
const { mockRobot } = Fixtures

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

describe('fetchModulesEpic', () => {
  let testScheduler

  const meta = { requestId: '1234' }
  const action: Types.FetchModulesAction = {
    ...Actions.fetchModules(mockRobot.name),
    meta,
  }

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls GET /modules', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockFetchModulesSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: mockState })
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRobotByName).toHaveBeenCalledWith(mockState, mockRobot.name)
      expect(mockFetchRobotApi).toHaveBeenCalledWith(mockRobot, {
        method: 'GET',
        path: '/modules',
      })
    })
  })

  it('maps successful response to FETCH_MODULES_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockFetchModulesSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchModulesSuccess(
          mockRobot.name,
          [
            Fixtures.mockMagneticModule,
            Fixtures.mockTemperatureModule,
            Fixtures.mockThermocycler,
          ],
          { ...meta, response: Fixtures.mockFetchModulesSuccessMeta }
        ),
      })
    })
  })

  it('maps successful legacy response to FETCH_MODULES_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockLegacyFetchModulesSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchModulesSuccess(
          mockRobot.name,
          [
            Fixtures.mockMagneticModule,
            Fixtures.mockTemperatureModule,
            Fixtures.mockThermocycler,
          ],
          { ...meta, response: Fixtures.mockFetchModulesSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_MODULES_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockFetchModulesFailure })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchModulesFailure(
          mockRobot.name,
          { message: 'AH' },
          { ...meta, response: Fixtures.mockFetchModulesFailureMeta }
        ),
      })
    })
  })
})
