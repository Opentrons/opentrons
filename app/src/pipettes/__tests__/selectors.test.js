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
    name: 'getAttachedPipettes returns no attached pipettes by default',
    selector: Selectors.getAttachedPipettes,
    state: { pipettes: {} },
    args: ['robotName'],
    expected: { left: null, right: null },
  },
  {
    name: 'getAttachedPipettes returns attached pipettes by mount',
    selector: Selectors.getAttachedPipettes,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: null,
            right: {
              id: 'abc',
              name: 'foo',
              model: 'bar',
              tip_length: 42,
              mount_axis: 'a',
              plunger_axis: 'b',
            },
          },
        },
      },
    },
    args: ['robotName'],
    expected: {
      left: null,
      right: {
        id: 'abc',
        name: 'foo',
        model: 'bar',
        tip_length: 42,
        mount_axis: 'a',
        plunger_axis: 'b',
      },
    },
  },
]

describe('robot api selectors', () => {
  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec
    test(name, () => expect(selector(state, ...args)).toEqual(expected))
  })
})
