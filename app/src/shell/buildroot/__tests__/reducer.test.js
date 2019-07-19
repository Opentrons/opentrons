import { INITIAL_STATE, buildrootReducer } from '../reducer'

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
      expected: {
        ...INITIAL_STATE,
        session: {
          robotName: 'robot-name',
          triggerUpdate: false,
          token: null,
          pathPrefix: null,
        },
      },
    },
    {
      name: 'handles buildroot:PREMIGRATION_DONE',
      action: {
        type: 'buildroot:PREMIGRATION_DONE',
        payload: 'robot-name',
      },
      initialState: {
        ...INITIAL_STATE,
        session: {
          robotName: 'robot-name',
          triggerUpdate: true,
          token: null,
          pathPrefix: null,
        },
      },
      expected: {
        ...INITIAL_STATE,
        session: {
          robotName: 'robot-name',
          triggerUpdate: true,
          token: null,
          pathPrefix: null,
        },
      },
    },
    {
      name: 'handles robotApi:RESPONSE__POST__/session/update/begin',
      action: {
        type: 'robotApi:RESPONSE__POST__/session/update/begin',
        payload: { host: { name: 'robot-name' }, body: { token: 'foobar' } },
        meta: { buildrootPrefix: '/session/update', buildrootToken: true },
      },
      initialState: {
        ...INITIAL_STATE,
        session: {
          robotName: 'robot-name',
          triggerUpdate: false,
          token: null,
          pathPrefix: null,
        },
      },
      expected: {
        ...INITIAL_STATE,
        session: {
          robotName: 'robot-name',
          triggerUpdate: false,
          token: 'foobar',
          pathPrefix: '/session/update',
        },
      },
    },
    {
      name: 'handles robotApi:RESPONSE__POST__/session/update/migration/begin',
      action: {
        type: 'robotApi:RESPONSE__POST__/session/update/migration/begin',
        payload: { host: { name: 'robot-name' }, body: { token: 'foobar' } },
        meta: {
          buildrootPrefix: '/session/update/migration',
          buildrootToken: true,
        },
      },
      initialState: {
        ...INITIAL_STATE,
        session: {
          robotName: 'robot-name',
          triggerUpdate: false,
          token: null,
          pathPrefix: null,
        },
      },
      expected: {
        ...INITIAL_STATE,
        session: {
          robotName: 'robot-name',
          triggerUpdate: false,
          token: 'foobar',
          pathPrefix: '/session/update/migration',
        },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, initialState, expected } = spec
    test(name, () =>
      expect(buildrootReducer(initialState, action)).toEqual(expected)
    )
  })
})
