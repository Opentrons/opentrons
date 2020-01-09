import * as actions from '../actions'

describe('buildroot action creators', () => {
  const SPECS = [
    {
      name: 'buildroot:SET_UPDATE_SEEN',
      creator: actions.setBuildrootUpdateSeen,
      args: ['robot-name'],
      expected: {
        type: 'buildroot:SET_UPDATE_SEEN',
        meta: { robotName: 'robot-name' },
      },
    },
    {
      name: 'buildroot:UPDATE_IGNORED',
      creator: actions.buildrootUpdateIgnored,
      args: ['robot-name'],
      expected: {
        type: 'buildroot:UPDATE_IGNORED',
        meta: { robotName: 'robot-name' },
      },
    },
    {
      name: 'buildroot:CHANGELOG_SEEN',
      creator: actions.buildrootChangelogSeen,
      args: ['robot-name'],
      expected: {
        type: 'buildroot:CHANGELOG_SEEN',
        meta: { robotName: 'robot-name' },
      },
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
      name: 'buildroot:START_UPDATE',
      creator: actions.startBuildrootUpdate,
      args: ['robot'],
      expected: {
        type: 'buildroot:START_UPDATE',
        payload: { robotName: 'robot', systemFile: null },
      },
    },
    {
      name: 'buildroot:START_UPDATE with user file',
      creator: actions.startBuildrootUpdate,
      args: ['robot', '/path/to/system.zip'],
      expected: {
        type: 'buildroot:START_UPDATE',
        payload: { robotName: 'robot', systemFile: '/path/to/system.zip' },
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
      name: 'buildroot:READ_USER_FILE',
      creator: actions.readUserBuildrootFile,
      args: ['/server/update/token/file'],
      expected: {
        type: 'buildroot:READ_USER_FILE',
        payload: { systemFile: '/server/update/token/file' },
        meta: { shell: true },
      },
    },
    {
      name: 'buildroot:UPLOAD_FILE',
      creator: actions.uploadBuildrootFile,
      args: [{ name: 'robot-name' }, '/server/update/token/file', null],
      expected: {
        type: 'buildroot:UPLOAD_FILE',
        payload: {
          host: { name: 'robot-name' },
          path: '/server/update/token/file',
          systemFile: null,
        },
        meta: { shell: true },
      },
    },
    {
      name: 'buildroot:UPLOAD_FILE with file specified',
      creator: actions.uploadBuildrootFile,
      args: [
        { name: 'robot-name' },
        '/server/update/token/file',
        '/path/to/system.zip',
      ],
      expected: {
        type: 'buildroot:UPLOAD_FILE',
        payload: {
          host: { name: 'robot-name' },
          path: '/server/update/token/file',
          systemFile: '/path/to/system.zip',
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
