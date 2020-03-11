// discovery actions test
import * as actions from '../actions'

describe('discovery actions', () => {
  const SPECS = [
    {
      name: 'startDiscovery',
      creator: actions.startDiscovery,
      args: [],
      expected: {
        type: 'discovery:START',
        payload: { timeout: null },
        meta: { shell: true },
      },
    },
    {
      name: 'startDiscovery with timeout specified',
      creator: actions.startDiscovery,
      args: [30000],
      expected: {
        type: 'discovery:START',
        payload: { timeout: 30000 },
        meta: { shell: true },
      },
    },
    {
      name: 'finishDiscovery',
      creator: actions.finishDiscovery,
      args: [],
      expected: { type: 'discovery:FINISH', meta: { shell: true } },
    },
    {
      name: 'removeRobot',
      creator: actions.removeRobot,
      args: ['robot-name'],
      expected: {
        type: 'discovery:REMOVE',
        payload: { robotName: 'robot-name' },
        meta: { shell: true },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec

    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
