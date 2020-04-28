// @flow
// support profile epic test
import { TestScheduler } from 'rxjs/testing'
import * as Profile from '../profile'
import { supportEpic } from '../epic'

import type { Action, State } from '../../types'
import type { SupportProfileUpdate } from '../types'

jest.mock('../profile')

const makeProfileUpdate: JestMockFn<
  [Action, State],
  SupportProfileUpdate | null
> = Profile.makeProfileUpdate

const updateProfile: JestMockFn<[SupportProfileUpdate], void> =
  Profile.updateProfile

const MOCK_ACTION: Action = ({ type: 'MOCK_ACTION' }: any)
const MOCK_STATE: State = ({ mockState: true }: any)

describe('support profile epic', () => {
  let testScheduler

  beforeEach(() => {
    makeProfileUpdate.mockReturnValue(null)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should do nothing with actions that do not map to a profile update', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot('-a', { a: MOCK_ACTION })
      const state$ = hot('s-', { s: MOCK_STATE })
      const result$ = supportEpic(action$, state$)

      expectObservable(result$, '--')
      flush()

      expect(makeProfileUpdate).toHaveBeenCalledWith(MOCK_ACTION, MOCK_STATE)
    })
  })

  it('should call a profile update ', () => {
    const profileUpdate = { someProp: 'value' }
    makeProfileUpdate.mockReturnValueOnce(profileUpdate)

    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot('-a', { a: MOCK_ACTION })
      const state$ = hot('s-', { s: MOCK_STATE })
      const result$ = supportEpic(action$, state$)

      expectObservable(result$)
      flush()

      expect(updateProfile).toHaveBeenCalledWith(profileUpdate)
    })
  })
})
