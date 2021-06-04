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
    {
      name: 'getRobotRestartPath',
      selector: Selectors.getRobotRestartPath,
      state: {
        robotSettings: { robotName: { restartPath: '/restart', settings: [] } },
      } as any,
      args: ['robotName'],
      expected: '/restart',
    },
    {
      name: 'getRobotRestartRequired when required',
      selector: Selectors.getRobotRestartRequired,
      state: {
        robotSettings: { robotName: { restartPath: '/restart', settings: [] } },
      } as any,
      args: ['robotName'],
      expected: true,
    },
    {
      name: 'getRobotRestartRequired when not required',
      selector: Selectors.getRobotRestartRequired,
      state: {
        robotSettings: { robotName: { restartPath: null, settings: [] } },
      } as any,
      args: ['robotName'],
      expected: false,
    },
    {
      name: 'getAllRestartRequiredRobots',
      selector: Selectors.getAllRestartRequiredRobots,
      state: {
        robotSettings: {
          a: { restartPath: '/restart', settings: [] },
          b: { restartPath: null, settings: [] },
          c: { restartPath: '/restart', settings: [] },
        },
      } as any,
      args: [],
      expected: ['a', 'c'],
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
