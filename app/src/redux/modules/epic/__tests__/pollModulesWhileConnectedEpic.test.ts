import { TestScheduler } from 'rxjs/testing'

import { connect, selectors as RobotSelectors } from '../../../robot'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { modulesEpic } from '../../epic'

import type { Action, State } from '../../../types'

jest.mock('../../../robot/selectors')

const mockState: State = { state: true } as any
const { mockRobot } = Fixtures

const mockGetConnectedRobotName = RobotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof RobotSelectors.getConnectedRobotName
>

describe('pollModulesWhileConnectedEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('polls connected robot until no longer connected', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const action = connect(mockRobot.name)

      mockGetConnectedRobotName
        .mockReturnValueOnce(mockRobot.name)
        .mockReturnValueOnce(mockRobot.name)
        .mockReturnValueOnce(mockRobot.name)
        .mockReturnValueOnce(null)

      const action$ = hot<Action>('a', { a: action })
      const state$ = hot<State>('a 15s a', { a: mockState })
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$).toBe('5s a 4999ms a 4999ms a', {
        a: Actions.fetchModules(mockRobot.name),
      })
    })
  })
})
