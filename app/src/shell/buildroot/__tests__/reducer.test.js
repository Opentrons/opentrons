import { INITIAL_STATE, buildrootReducer } from '../reducer'

const BASE_SESSION = {
  robotName: 'robot-name',
  triggerUpdate: false,
  uploadStarted: false,
  committed: false,
  restarted: false,
  error: false,
  token: null,
  pathPrefix: null,
  stage: null,
  progress: null,
}

describe('app/shell/buildroot reducer', () => {
  const SPECS = [
    {
      name: 'handles buildroot:UPDATE_INFO',
      action: {
        type: 'buildroot:UPDATE_INFO',
        payload: { version: '1.0.0', releaseNotes: 'release notes' },
      },
      initialState: { ...INITIAL_STATE, info: null },
      expected: {
        ...INITIAL_STATE,
        info: { version: '1.0.0', releaseNotes: 'release notes' },
      },
    },
    {
      name: 'handles buildroot:SET_UPDATE_SEEN',
      action: { type: 'buildroot:SET_UPDATE_SEEN' },
      initialState: { ...INITIAL_STATE, seen: false },
      expected: { ...INITIAL_STATE, seen: true },
    },
    {
      name: 'handles buildroot:DOWNLOAD_PROGRESS',
      action: { type: 'buildroot:DOWNLOAD_PROGRESS', payload: 42 },
      initialState: { ...INITIAL_STATE, downloadProgress: null },
      expected: { ...INITIAL_STATE, downloadProgress: 42 },
    },
    {
      name: 'handles buildroot:DOWNLOAD_ERROR',
      action: { type: 'buildroot:DOWNLOAD_ERROR', payload: 'AH' },
      initialState: { ...INITIAL_STATE, downloadError: null },
      expected: { ...INITIAL_STATE, downloadError: 'AH' },
    },
    {
      name: 'handles buildroot:START_UPDATE',
      action: { type: 'buildroot:START_UPDATE', payload: 'robot-name' },
      initialState: { ...INITIAL_STATE, session: null },
      expected: { ...INITIAL_STATE, session: BASE_SESSION },
    },
    {
      name: 'handles buildroot:PREMIGRATION_DONE',
      action: {
        type: 'buildroot:PREMIGRATION_DONE',
        payload: 'robot-name',
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, triggerUpdate: true },
      },
    },
    {
      name: 'handles robotApi:RESPONSE__POST__/session/update/begin',
      action: {
        type: 'robotApi:RESPONSE__POST__/session/update/begin',
        payload: { host: { name: 'robot-name' }, body: { token: 'foobar' } },
        meta: { buildrootPrefix: '/session/update', buildrootToken: true },
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          token: 'foobar',
          pathPrefix: '/session/update',
        },
      },
    },
    {
      name: 'handles robotApi:RESPONSE__POST__/session/update/migration/begin',
      action: {
        type: 'robotApi:RESPONSE__POST__/session/update/migration/begin',
        payload: { host: { name: 'robot-name' }, body: { token: 'a-token' } },
        meta: {
          buildrootPrefix: '/session/update/migration',
          buildrootToken: true,
        },
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          token: 'a-token',
          pathPrefix: '/session/update/migration',
        },
      },
    },
    {
      name: 'handles robotApi:RESPONSE__POST__/session/update/:token/status',
      action: {
        type: 'robotApi:RESPONSE__POST__/session/update/a-token/status',
        payload: {
          host: { name: 'robot-name' },
          body: { stage: 'awaiting-file', progress: 0.1 },
        },
        meta: { buildrootStatus: true },
      },
      initialState: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          token: 'a-token',
          pathPrefix: '/session/update',
        },
      },
      expected: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          token: 'a-token',
          pathPrefix: '/session/update',
          stage: 'awaiting-file',
          progress: 10,
        },
      },
    },
    {
      name: 'handles buildroot:UPLOAD_FILE',
      action: {
        type: 'buildroot:UPLOAD_FILE',
        payload: {
          host: { name: 'robot-name' },
          path: '/server/update/a-token/file',
        },
        meta: { shell: true },
      },
      initialState: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          token: 'a-token',
          pathPrefix: '/session/update',
          stage: 'awaiting-file',
          uploadStarted: false,
        },
      },
      expected: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          token: 'a-token',
          pathPrefix: '/session/update',
          stage: 'awaiting-file',
          uploadStarted: true,
        },
      },
    },
    {
      name: 'handles robotApi:REQUEST__POST__/session/update/:token/commit',
      action: {
        type: 'robotApi:REQUEST__POST__/session/update/a-token/status',
        payload: { host: { name: 'robot-name' } },
        meta: { buildrootCommit: true },
      },
      initialState: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          committed: false,
          token: 'a-token',
          pathPrefix: '/session/update',
          stage: 'done',
        },
      },
      expected: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          committed: true,
          token: 'a-token',
          pathPrefix: '/session/update',
          stage: 'done',
        },
      },
    },
    {
      name: 'handles robotApi:REQUEST__POST__/server/restart',
      action: {
        type: 'robotApi:REQUEST__POST__/server/restart',
        payload: { host: { name: 'robot-name' } },
        meta: { buildrootRestart: true },
      },
      initialState: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          restarted: false,
          stage: 'ready-for-restart',
        },
      },
      expected: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          restarted: true,
          stage: 'ready-for-restart',
        },
      },
    },
    {
      name: 'handles buildroot:CLEAR_SESSION',
      action: { type: 'buildroot:CLEAR_SESSION' },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: { ...INITIAL_STATE, session: null },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, initialState, expected } = spec
    test(name, () =>
      expect(buildrootReducer(initialState, action)).toEqual(expected)
    )
  })
})
