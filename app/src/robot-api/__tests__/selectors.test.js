// @flow

import * as Selectors from '../selectors'
import type { State } from '../../types'

type SelectorSpec = {|
  name: string,
  selector: (State, ...Array<any>) => mixed,
  state: $Shape<State>,
  args?: Array<any>,
  expected: mixed,
|}

const SPECS: Array<SelectorSpec> = [
  {
    name: 'getRequestById returns null by default',
    selector: Selectors.getRequestById,
    state: { robotApi: {} },
    args: ['abc'],
    expected: null,
  },
  {
    name: 'getRequestById returns state if it exists',
    selector: Selectors.getRequestById,
    state: { robotApi: { abc: { status: 'pending' } } },
    args: ['abc'],
    expected: { status: 'pending' },
  },
  {
    name: 'getRequests returns zip-able array of request states',
    selector: Selectors.getRequests,
    state: { robotApi: { abc: { status: 'pending' } } },
    args: [['abc', 'def']],
    expected: [{ status: 'pending' }, null],
  },
]

describe('robot api selectors', () => {
  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec
    it(name, () => expect(selector(state, ...args)).toEqual(expected))
  })
})
