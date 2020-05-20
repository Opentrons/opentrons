// @flow
import noop from 'lodash/noop'
import * as Fixtures from '../__fixtures__'
import * as Selectors from '../selectors'

import type { State } from '../../types'

jest.mock('../../robot/selectors')

type SelectorSpec = {|
  name: string,
  selector: (State, ...Array<any>) => mixed,
  state: $Shape<State>,
  args?: Array<any>,
  before?: () => mixed,
  expected: mixed,
|}

const SPECS: Array<SelectorSpec> = [
  {
    name: 'getRobotSessions returns null if no sessions',
    selector: Selectors.getRobotSessions,
    state: {
      sessions: {},
    },
    args: ['germanium-cobweb'],
    expected: null,
  },
  {
    name: 'getRobotSessions returns session map',
    selector: Selectors.getRobotSessions,
    state: {
      sessions: {
        'germanium-cobweb': {
          robotSessions: {
            [Fixtures.mockSessionId]: Fixtures.mockSessionData,
          },
        },
      },
    },
    args: ['germanium-cobweb'],
    expected: {
      [Fixtures.mockSessionId]: Fixtures.mockSessionData,
    },
  },
  {
    name: 'getRobotSessionById returns null if not found',
    selector: Selectors.getRobotSessionById,
    state: {
      sessions: {
        'germanium-cobweb': {
          robotSessions: {
            [Fixtures.mockSessionId]: Fixtures.mockSessionData,
          },
        },
      },
    },
    args: ['germanium-cobweb', 'non_existent_session_id'],
    expected: null,
  },
  {
    name: 'getRobotSessionById returns found session',
    selector: Selectors.getRobotSessionById,
    state: {
      sessions: {
        'germanium-cobweb': {
          robotSessions: {
            [Fixtures.mockSessionId]: Fixtures.mockSessionData,
          },
        },
      },
    },
    args: ['germanium-cobweb', Fixtures.mockSessionId],
    expected: Fixtures.mockSessionData,
  },
]

describe('sessions selectors', () => {
  SPECS.forEach(spec => {
    const { name, selector, state, args = [], before = noop, expected } = spec
    it(name, () => {
      before()
      expect(selector(state, ...args)).toEqual(expected)
    })
  })
})
