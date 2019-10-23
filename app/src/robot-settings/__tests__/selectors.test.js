// @flow
import * as Selectors from '../selectors'
import type { State } from '../../types'

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
            restartRequired: false,
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
      name: 'getRobotRestartRequired',
      selector: Selectors.getRobotRestartRequired,
      state: {
        robotSettings: {
          robotName: {
            restartRequired: true,
            settings: [],
          },
        },
      },
      args: ['robotName'],
      expected: true,
    },
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec

    test(name, () => {
      const result = selector(state, ...args)
      expect(result).toEqual(expected)
    })
  })
})
