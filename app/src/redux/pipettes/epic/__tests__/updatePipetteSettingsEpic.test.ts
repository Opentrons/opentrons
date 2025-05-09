import { TestScheduler } from 'rxjs/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as Fixtures from '../../__fixtures__'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as RobotApiHttp from '../../../robot-api/http'
import * as Actions from '../../actions'
import { pipettesEpic } from '../../epic'

import type { RobotApiRequestMeta } from '../../../robot-api/types'
import type { Action, State } from '../../../types'
import type * as Types from '../../types'

vi.mock('../../../robot-api/http')
vi.mock('../../../discovery/selectors')

const mockState: State = { state: true } as any
const { mockRobot, mockAttachedPipette: mockPipette } = Fixtures

describe('updatePipetteSettingsEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    vi.mocked(DiscoverySelectors.getRobotByName).mockReturnValue(
      mockRobot as any
    )

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
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
        vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
          cold('r', { r: Fixtures.mockFetchPipetteSettingsSuccess })
        )

        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('a-a', { a: mockState })
        const output$ = pipettesEpic(action$, state$)

        expectObservable(output$)
        flush()

        expect(DiscoverySelectors.getRobotByName).toHaveBeenCalledWith(
          mockState,
          mockRobot.name
        )
        expect(RobotApiHttp.fetchRobotApi).toHaveBeenCalledWith(mockRobot, {
          method: 'PATCH',
          path: `/settings/pipettes/${mockPipette.id}`,
          body: { fields: { fieldA: { value: 42 }, fieldB: null } },
        })
      })
    })

    it('maps successful response to UPDATE_PIPETTE_SETTINGS_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
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
        vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
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
