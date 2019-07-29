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
      args: ['AH!'],
      expected: {
        type: 'buildroot:UNEXPECTED_ERROR',
        payload: { message: 'AH!' },
      },
    },
    {
      name: 'buildroot:UPLOAD_FILE',
      creator: actions.uploadBuildrootFile,
      args: [{ name: 'robot-name' }, '/server/update/token/file'],
      expected: {
        type: 'buildroot:UPLOAD_FILE',
        payload: {
          host: { name: 'robot-name' },
          path: '/server/update/token/file',
        },
        meta: { shell: true },
      },
    },
    {
      name: 'buildroot:CLEAR_SESSION',
      creator: actions.clearBuildrootSession,
      args: [],
      expected: { type: 'buildroot:CLEAR_SESSION' },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    test(name, () => expect(creator(...args)).toEqual(expected))
  })
})
