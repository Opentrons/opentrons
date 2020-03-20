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
    name: 'getDeckCheckSuccess returns undefined if no deck cal check session',
    selector: Selectors.getDeckCheckSession,
    state: {
      calibration: {},
    },
    args: ['germanium-cobweb'],
    expected: undefined,
  },
  {
    name: 'getDeckCheckSuccess returns ',
    selector: Selectors.getDeckCheckSession,
    state: {
      calibration: {
        'germanium-cobweb': {
          deckCheck: Fixtures.mockDeckCheckSessionData,
        },
      },
    },
    args: ['germanium-cobweb'],
    expected: Fixtures.mockDeckCheckSessionData,
  },
]

describe('calibration selectors', () => {
  SPECS.forEach(spec => {
    const { name, selector, state, args = [], before = noop, expected } = spec
    it(name, () => {
      before()
      expect(selector(state, ...args)).toEqual(expected)
    })
  })
})
