// @flow

import type { State } from '../../types'
import * as Selectors from '../selectors'

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
    state: {
      robotControls: {
        robotName: {
          lightsOn: false,
          movementStatus: null,
          movementError: null,
        },
      },
    },
    args: ['robotName'],
    expected: false,
  },
  {
    name: 'getMovementStatus returns null by default',
    selector: Selectors.getMovementStatus,
    state: {
      robotControls: {},
    },
    args: ['robotName'],
    expected: null,
  },
  {
    name: 'getMovementStatus returns value if present',
    selector: Selectors.getMovementStatus,
    state: {
      robotControls: {
        robotName: {
          lightsOn: false,
          movementStatus: 'homing',
          movementError: null,
        },
      },
    },
    args: ['robotName'],
    expected: 'homing',
  },
  {
    name: 'getMovementError returns null by default',
    selector: Selectors.getMovementError,
    state: {
      robotControls: {},
    },
    args: ['robotName'],
    expected: null,
  },
  {
    name: 'getMovementError returns value if present',
    selector: Selectors.getMovementError,
    state: {
      robotControls: {
        robotName: {
          lightsOn: false,
          movementStatus: null,
          movementError: 'AH',
        },
      },
    },
    args: ['robotName'],
    expected: 'AH',
  },
]

describe('robot controls selectors', () => {
  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec
    it(name, () => expect(selector(state, ...args)).toEqual(expected))
  })
})
