import * as Selectors from '../selectors'
import type { State } from '../../types'

interface SelectorSpec {
  name: string
  selector: (state: State, ...args: any[]) => unknown
  state: State
  args?: any[]
  expected: unknown
}

const SPECS: SelectorSpec[] = [
  {
    name: 'getLightsOn returns null by default',
    selector: Selectors.getLightsOn,
    state: { robotControls: {} } as any,
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
    } as any,
    args: ['robotName'],
    expected: false,
  },
  {
    name: 'getMovementStatus returns null by default',
    selector: Selectors.getMovementStatus,
    state: {
      robotControls: {},
    } as any,
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
    } as any,
    args: ['robotName'],
    expected: 'homing',
  },
  {
    name: 'getMovementError returns null by default',
    selector: Selectors.getMovementError,
    state: {
      robotControls: {},
    } as any,
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
    } as any,
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
