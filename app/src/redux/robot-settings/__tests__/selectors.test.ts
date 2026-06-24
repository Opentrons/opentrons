import { describe, expect, it } from 'vitest'

import * as Selectors from '../selectors'

import type { State } from '../../types'

interface SelectorSpec {
  name: string
  selector: (state: State, ...args: any[]) => unknown
  state: State
  args?: any[]
  expected: unknown
}

describe('robot settings selectors', () => {
  const SPECS: SelectorSpec[] = [
    {
      name: 'getRobotSettings',
      selector: Selectors.getRobotSettings,
      state: {
        robotSettings: {
          robotName: {
            restartPath: null,
            settings: [
              { id: 'foo', title: 'Foo', description: 'Foo', value: true },
            ],
          },
        },
      } as any,
      args: ['robotName'],
      expected: [{ id: 'foo', title: 'Foo', description: 'Foo', value: true }],
    },
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec

    it(name, () => {
      const result = selector(state, ...args)
      expect(result).toEqual(expected)
    })
  })
})
