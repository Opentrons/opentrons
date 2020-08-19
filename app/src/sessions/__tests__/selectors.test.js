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
            [Fixtures.mockSessionId]:
              Fixtures.mockCalibrationCheckSessionAttributes,
          },
        },
      },
    },
    args: ['germanium-cobweb'],
    expected: {
      [Fixtures.mockSessionId]: Fixtures.mockCalibrationCheckSessionAttributes,
    },
  },
  {
    name: 'getRobotSessionById returns null if not found',
    selector: Selectors.getRobotSessionById,
    state: {
      sessions: {
        'germanium-cobweb': {
          robotSessions: {
            [Fixtures.mockSessionId]:
              Fixtures.mockCalibrationCheckSessionAttributes,
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
            [Fixtures.mockSessionId]:
              Fixtures.mockCalibrationCheckSessionAttributes,
          },
        },
      },
    },
    args: ['germanium-cobweb', Fixtures.mockSessionId],
    expected: Fixtures.mockCalibrationCheckSessionAttributes,
  },
  {
    name:
      'getAnalyticsPropsForRobotSessionById returns props for check cal session',
    selector: Selectors.getAnalyticsPropsForRobotSessionById,
    state: {
      sessions: {
        'germanium-cobweb': {
          robotSessions: {
            [Fixtures.mockSessionId]:
              Fixtures.mockCalibrationCheckSessionAttributes,
          },
        },
      },
    },
    args: ['germanium-cobweb', Fixtures.mockSessionId],
    expected: Fixtures.mockCalibrationCheckSessionAnalyticsProps,
  },
  {
    name:
      'getAnalyticsPropsForRobotSessionById returns null for untracked session type',
    selector: Selectors.getAnalyticsPropsForRobotSessionById,
    state: {
      sessions: {
        'germanium-cobweb': {
          robotSessions: {
            [Fixtures.mockSessionId]: {
              ...Fixtures.mockCalibrationCheckSessionAttributes,
              sessionType: 'FakeUntrackedSessionType',
            },
          },
        },
      },
    },
    args: ['germanium-cobweb', Fixtures.mockSessionId],
    expected: null,
  },
  {
    name:
      'getAnalyticsPropsForRobotSessionById returns null if session not found',
    selector: Selectors.getAnalyticsPropsForRobotSessionById,
    state: {
      sessions: {
        'germanium-cobweb': {
          robotSessions: {
            [Fixtures.mockSessionId]: {
              ...Fixtures.mockCalibrationCheckSessionAttributes,
              sessionType: 'FakeUntrackedSessionType',
            },
          },
        },
      },
    },
    args: ['germanium-cobweb', 'fake_nonexistent_session_id'],
    expected: null,
  },
  {
    name:
      'getIntercomEventPropsForRobotSessionById returns props for check cal session',
    selector: Selectors.getIntercomEventPropsForRobotSessionById,
    state: {
      sessions: {
        'germanium-cobweb': {
          robotSessions: {
            [Fixtures.mockSessionId]:
              Fixtures.mockCalibrationCheckSessionAttributes,
          },
        },
      },
    },
    args: ['germanium-cobweb', Fixtures.mockSessionId],
    expected: Fixtures.mockCalibrationCheckSessionIntercomProps,
  },
  {
    name:
      'getIntercomEventPropsForRobotSessionById returns null for untracked session type',
    selector: Selectors.getIntercomEventPropsForRobotSessionById,
    state: {
      sessions: {
        'germanium-cobweb': {
          robotSessions: {
            [Fixtures.mockSessionId]: {
              ...Fixtures.mockCalibrationCheckSessionAttributes,
              sessionType: 'FakeUntrackedSessionType',
            },
          },
        },
      },
    },
    args: ['germanium-cobweb', Fixtures.mockSessionId],
    expected: null,
  },
  {
    name:
      'getIntercomEventPropsForRobotSessionById returns null if session not found',
    selector: Selectors.getIntercomEventPropsForRobotSessionById,
    state: {
      sessions: {
        'germanium-cobweb': {
          robotSessions: {
            [Fixtures.mockSessionId]: {
              ...Fixtures.mockCalibrationCheckSessionAttributes,
              sessionType: 'FakeUntrackedSessionType',
            },
          },
        },
      },
    },
    args: ['germanium-cobweb', 'fake_nonexistent_session_id'],
    expected: null,
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
