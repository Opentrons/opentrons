// @flow
import { TestScheduler } from 'rxjs/testing'

import * as Fixtures from '../../__fixtures__'
import {
  actions as RobotActions,
  selectors as RobotSelectors,
} from '../../../robot'
import type { State } from '../../../types'
import * as Actions from '../../actions'
import { modulesEpic } from '../../epic'

jest.mock('../../../robot/selectors')

const mockState = { state: true }
const { mockRobot } = Fixtures

const mockGetConnectedRobotName: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getConnectedRobotName, State>
> = RobotSelectors.getConnectedRobotName

describe('pollModulesWhileConnectedEpic', () => {
  let testScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('does nothing if connect fails', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const action = RobotActions.connectResponse({ message: 'AH' })

      const action$ = hot('--a', { a: action })
      const state$ = hot('--a', { a: mockState })
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$).toBe('---')
    })
  })

  it('polls connected robot until no longer connected', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const action = RobotActions.connectResponse(null, ['create'])

      mockGetConnectedRobotName
        .mockReturnValueOnce(mockRobot.name)
        .mockReturnValueOnce(mockRobot.name)
        .mockReturnValueOnce(mockRobot.name)
        .mockReturnValueOnce(null)

      const action$ = hot('a', { a: action })
      const state$ = hot('a 15s a', { a: mockState })
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$).toBe('5s a 4999ms a 4999ms a', {
        a: Actions.fetchModules(mockRobot.name),
      })
    })
  })
})
