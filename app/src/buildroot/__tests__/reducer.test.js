import { mockRobot } from '../../robot-api/__fixtures__'
import { INITIAL_STATE, buildrootReducer } from '../reducer'

const BASE_SESSION = {
  robotName: mockRobot.name,
  userFileInfo: null,
  step: null,
  token: null,
  pathPrefix: null,
  stage: null,
  progress: null,
  error: null,
}

describe('buildroot reducer', () => {
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
      name: 'handles buildroot:USER_FILE_INFO',
      action: {
        type: 'buildroot:USER_FILE_INFO',
        payload: {
          systemFile: '/path/to/system.zip',
          version: '1.0.0',
          releaseNotes: 'release notes',
        },
      },
      initialState: {
        ...INITIAL_STATE,
        session: { robotName: mockRobot.name },
      },
      expected: {
        ...INITIAL_STATE,
        session: {
          robotName: mockRobot.name,
          userFileInfo: {
            systemFile: '/path/to/system.zip',
            version: '1.0.0',
            releaseNotes: 'release notes',
          },
        },
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
      action: {
        type: 'buildroot:START_UPDATE',
        payload: { robotName: mockRobot.name },
      },
      initialState: { ...INITIAL_STATE, session: null },
      expected: { ...INITIAL_STATE, session: BASE_SESSION },
    },
    {
      name: 'buildroot:START_UPDATE preserves user file info',
      action: {
        type: 'buildroot:START_UPDATE',
        payload: { robotName: mockRobot.name },
      },
      initialState: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          robotName: mockRobot.name,
          userFileInfo: { systemFile: 'system.zip' },
        },
      },
      expected: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          robotName: mockRobot.name,
          userFileInfo: { systemFile: 'system.zip' },
        },
      },
    },
    {
      name: 'handles buildroot:START_PREMIGRATION',
      action: {
        type: 'buildroot:START_PREMIGRATION',
        payload: { name: mockRobot.name, ip: '10.10.0.0', port: 31950 },
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, step: 'premigration' },
      },
    },
    {
      name: 'handles buildroot:PREMIGRATION_DONE',
      action: { type: 'buildroot:PREMIGRATION_DONE' },
      initialState: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, step: 'premigration' },
      },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, step: 'premigrationRestart' },
      },
    },
    {
      name: 'handles buildroot:CREATE_SESSION',
      action: {
        type: 'buildroot:CREATE_SESSION',
        payload: { host: mockRobot, sessionPath: '/session/update/begin' },
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, step: 'getToken' },
      },
    },
    {
      name: 'handles buildroot:CREATE_SESSION_SUCCESS',
      action: {
        type: 'buildroot:CREATE_SESSION_SUCCESS',
        payload: {
          host: mockRobot,
          pathPrefix: '/session/update',
          token: 'foobar',
        },
      },
      initialState: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          step: 'getToken',
        },
      },
      expected: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          step: 'getToken',
          pathPrefix: '/session/update',
          token: 'foobar',
        },
      },
    },
    {
      name: 'handles buildroot:STATUS',
      action: {
        type: 'buildroot:STATUS',
        payload: { stage: 'writing', progress: 10, message: 'Writing file' },
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, stage: 'writing', progress: 10 },
      },
    },
    {
      name: 'handles buildroot:STATUS with error',
      action: {
        type: 'buildroot:STATUS',
        payload: { stage: 'error', error: 'error-type', message: 'AH!' },
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, stage: 'error', error: 'AH!' },
      },
    },
    {
      name: 'handles buildroot:UPLOAD_FILE',
      action: {
        type: 'buildroot:UPLOAD_FILE',
        payload: {
          host: { name: mockRobot.name },
          path: '/server/update/a-token/file',
        },
        meta: { shell: true },
      },
      initialState: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, step: 'getToken' },
      },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, step: 'uploadFile' },
      },
    },
    {
      name: 'handles buildroot:FILE_UPLOAD_DONE',
      action: { type: 'buildroot:FILE_UPLOAD_DONE' },
      initialState: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          step: 'uploadFile',
        },
      },
      expected: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          step: 'processFile',
        },
      },
    },
    {
      name: 'handles buildroot:CLEAR_SESSION',
      action: { type: 'buildroot:CLEAR_SESSION' },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: { ...INITIAL_STATE, session: null },
    },
    {
      name: 'handles buildroot:UNEXPECTED_ERROR',
      action: {
        type: 'buildroot:UNEXPECTED_ERROR',
        payload: { message: 'AH!' },
      },
      initialState: { ...INITIAL_STATE, info: null },
      expected: {
        ...INITIAL_STATE,
        session: { ...INITIAL_STATE.session, error: 'AH!' },
      },
    },
    {
      name: 'handles buildroot:PREMIGRATION_ERROR',
      action: {
        type: 'buildroot:PREMIGRATION_ERROR',
        payload: { message: 'AH!' },
      },
      initialState: { ...INITIAL_STATE, info: null },
      expected: {
        ...INITIAL_STATE,
        session: { ...INITIAL_STATE.session, error: 'AH!' },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, initialState, expected } = spec
    it(name, () =>
      expect(buildrootReducer(initialState, action)).toEqual(expected)
    )
  })
})
