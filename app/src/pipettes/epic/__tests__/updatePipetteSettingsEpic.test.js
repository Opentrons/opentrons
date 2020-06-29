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
import { pipettesEpic } from '../../epic'
import * as Types from '../../types'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')

const mockState = { state: true }
const { mockRobot, mockAttachedPipette: mockPipette } = Fixtures

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

describe('updatePipetteSettingsEpic', () => {
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

  describe('handles UPDATE_PIPETTE_SETTINGS', () => {
    const meta = { requestId: '1234' }
    const action: Types.UpdatePipetteSettingsAction = {
      ...Actions.updatePipetteSettings(mockRobot.name, mockPipette.id, {
        fieldA: 42,
        fieldB: null,
      }),
      meta,
    }

    it('calls PATCH /settings/pipettes/:pipetteId', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockFetchPipetteSettingsSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: mockState })
        const output$ = pipettesEpic(action$, state$)

        expectObservable(output$)
        flush()

        expect(mockGetRobotByName).toHaveBeenCalledWith(
          mockState,
          mockRobot.name
        )
        expect(mockFetchRobotApi).toHaveBeenCalledWith(mockRobot, {
          method: 'PATCH',
          path: `/settings/pipettes/${mockPipette.id}`,
          body: { fields: { fieldA: { value: 42 }, fieldB: null } },
        })
      })
    })

    it('maps successful response to UPDATE_PIPETTE_SETTINGS_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockUpdatePipetteSettingsSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = pipettesEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.updatePipetteSettingsSuccess(
            mockRobot.name,
            mockPipette.id,
            Fixtures.mockUpdatePipetteSettingsSuccess.body.fields,
            { ...meta, response: Fixtures.mockUpdatePipetteSettingsSuccessMeta }
          ),
        })
      })
    })

    it('maps failed response to UPDATE_PIPETTE_SETTINGS_FAILURE', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockUpdatePipetteSettingsFailure })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = pipettesEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.updatePipetteSettingsFailure(
            mockRobot.name,
            mockPipette.id,
            { message: 'AH' },
            { ...meta, response: Fixtures.mockUpdatePipetteSettingsFailureMeta }
          ),
        })
      })
    })
  })
})
