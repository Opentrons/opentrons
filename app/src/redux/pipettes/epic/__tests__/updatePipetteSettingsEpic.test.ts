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
const { mockRobot, mockAttachedPipette: mockPipette } = Fixtures

const mockFetchRobotApi = RobotApiHttp.fetchRobotApi as jest.MockedFunction<
  typeof RobotApiHttp.fetchRobotApi
>

const mockGetRobotByName = DiscoverySelectors.getRobotByName as jest.MockedFunction<
  typeof DiscoverySelectors.getRobotByName
>

describe('updatePipetteSettingsEpic', () => {
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

  describe('handles UPDATE_PIPETTE_SETTINGS', () => {
    const meta: RobotApiRequestMeta = { requestId: '1234' } as any
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

        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('a-a', { a: {} } as any)
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

        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('a-a', { a: {} } as any)
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
