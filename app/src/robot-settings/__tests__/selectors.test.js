// @flow
import type { State } from '../../types'
import * as Selectors from '../selectors'

type SelectorSpec = {|
  name: string,
  selector: ($Shape<State>, ...Array<any>) => mixed,
  state: $Shape<State>,
  args?: Array<any>,
  expected: mixed,
|}

describe('robot settings selectors', () => {
  const SPECS: Array<SelectorSpec> = [
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
      },
      args: ['robotName'],
      expected: [{ id: 'foo', title: 'Foo', description: 'Foo', value: true }],
    },
    {
      name: 'getRobotRestartPath',
      selector: Selectors.getRobotRestartPath,
      state: {
        robotSettings: { robotName: { restartPath: '/restart', settings: [] } },
      },
      args: ['robotName'],
      expected: '/restart',
    },
    {
      name: 'getRobotRestartRequired when required',
      selector: Selectors.getRobotRestartRequired,
      state: {
        robotSettings: { robotName: { restartPath: '/restart', settings: [] } },
      },
      args: ['robotName'],
      expected: true,
    },
    {
      name: 'getRobotRestartRequired when not required',
      selector: Selectors.getRobotRestartRequired,
      state: {
        robotSettings: { robotName: { restartPath: null, settings: [] } },
      },
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
      },
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
