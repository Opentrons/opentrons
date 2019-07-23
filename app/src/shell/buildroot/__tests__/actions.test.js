import * as actions from '../actions'

describe('app/shell/buildroot action creators', () => {
  const SPECS = [
    {
      name: 'buildroot:SET_UPDATE_SEEN',
      creator: actions.setBuildrootUpdateSeen,
      args: [],
      expected: { type: 'buildroot:SET_UPDATE_SEEN' },
    },
    {
      name: 'buildroot:START_PREMIGRATION',
      creator: actions.startBuildrootPremigration,
      args: [{ name: 'robot', ip: '10.10.0.0', port: 31950 }],
      expected: {
        type: 'buildroot:START_PREMIGRATION',
        payload: { name: 'robot', ip: '10.10.0.0', port: 31950 },
        meta: { shell: true },
      },
    },
    {
      name: 'buildroot:UNEXPECTED_ERROR',
      creator: actions.unexpectedBuildrootError,
      args: [],
      expected: { type: 'buildroot:UNEXPECTED_ERROR' },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    test(name, () => expect(creator(...args)).toEqual(expected))
  })
})
