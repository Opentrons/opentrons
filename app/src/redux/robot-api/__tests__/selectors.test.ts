import * as Selectors from '../selectors'
import type { State } from '../../types'

interface SelectorSpec {
  name: string
  selector: (state: State, ...args: any[]) => unknown
  state: Partial<State>
  args?: any[]
  expected: unknown
}

const SPECS: SelectorSpec[] = [
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
    it(name, () => expect(selector(state as State, ...args)).toEqual(expected))
  })
})
