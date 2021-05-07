import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'

import * as Actions from '../../actions'
import * as Types from '../../types'
import { modulesEpic } from '../../epic'

import type { Action, State } from '../../../types'
import type {
  RobotApiRequestMeta,
  RobotApiResponse,
} from '../../../robot-api/types'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')

const mockState = { state: true }
const { mockRobot } = Fixtures

const mockFetchRobotApi = RobotApiHttp.fetchRobotApi as jest.MockedFunction<
  typeof RobotApiHttp.fetchRobotApi
>

const mockGetRobotByName = DiscoverySelectors.getRobotByName as jest.MockedFunction<
  typeof DiscoverySelectors.getRobotByName
>

describe('fetchModulesEpic', () => {
  let testScheduler: TestScheduler

  const meta: RobotApiRequestMeta = { requestId: '1234' } as any
  const action: Types.FetchModulesAction = {
    ...Actions.fetchModules(mockRobot.name),
    meta,
  }

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot as any)

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
        cold<RobotApiResponse>('r', {
          r: Fixtures.mockFetchModulesSuccess,
        } as any)
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: mockState } as any)
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
        cold<RobotApiResponse>('r', {
          r: Fixtures.mockFetchModulesSuccess,
        } as any)
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
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
        cold<RobotApiResponse>('r', {
          r: Fixtures.mockLegacyFetchModulesSuccess,
        })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchModulesSuccess(
          mockRobot.name,
          [
            {
              ...Fixtures.mockMagneticModule,
              usbPort: { hub: null, port: null },
            },
            {
              ...Fixtures.mockTemperatureModule,
              usbPort: { hub: null, port: null },
            },
            {
              ...Fixtures.mockThermocycler,
              usbPort: { hub: null, port: null },
            },
          ],
          { ...meta, response: Fixtures.mockFetchModulesSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_MODULES_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold<RobotApiResponse>('r', { r: Fixtures.mockFetchModulesFailure })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
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
