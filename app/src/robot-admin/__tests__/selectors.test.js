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

describe('robot admin selectors', () => {
  const SPECS: Array<SelectorSpec> = [
    {
      name: 'getRobotAdminStatus returns null by default',
      selector: Selectors.getRobotAdminStatus,
      state: { robotAdmin: {} },
      args: ['robotName'],
      expected: null,
    },
    {
      name: 'getRobotAdminStatus',
      selector: Selectors.getRobotAdminStatus,
      state: { robotAdmin: { robotName: { status: 'up' } } },
      args: ['robotName'],
      expected: 'up',
    },
    {
      name: 'getRobotRestarting with status up',
      selector: Selectors.getRobotRestarting,
      state: { robotAdmin: { robotName: { status: 'up' } } },
      args: ['robotName'],
      expected: false,
    },
    {
      name: 'getRobotRestarting with status down',
      selector: Selectors.getRobotRestarting,
      state: { robotAdmin: { robotName: { status: 'down' } } },
      args: ['robotName'],
      expected: false,
    },
    {
      name: 'getRobotRestarting with status restart-failed',
      selector: Selectors.getRobotRestarting,
      state: { robotAdmin: { robotName: { status: 'restart-failed' } } },
      args: ['robotName'],
      expected: false,
    },
    {
      name: 'getRobotRestarting with status restart-pending',
      selector: Selectors.getRobotRestarting,
      state: { robotAdmin: { robotName: { status: 'restart-pending' } } },
      args: ['robotName'],
      expected: true,
    },
    {
      name: 'getRobotRestarting with status restarting',
      selector: Selectors.getRobotRestarting,
      state: { robotAdmin: { robotName: { status: 'restarting' } } },
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
