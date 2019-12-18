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
    name: 'getLightsOn returns null by default',
    selector: Selectors.getLightsOn,
    state: { robotControls: {} },
    args: ['robotName'],
    expected: null,
  },
  {
    name: 'getLightsOn returns value if present',
    selector: Selectors.getLightsOn,
    state: { robotControls: { robotName: { lightsOn: false } } },
    args: ['robotName'],
    expected: false,
  },
]

describe('robot controls selectors', () => {
  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec
    test(name, () => expect(selector(state, ...args)).toEqual(expected))
  })
})
