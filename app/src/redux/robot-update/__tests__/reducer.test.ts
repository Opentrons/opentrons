import { mockRobot } from '../../robot-api/__fixtures__'
import { INITIAL_STATE, robotUpdateReducer } from '../reducer'
import type { Action } from '../../types'
import type { RobotUpdateState } from '../types'

const BASE_SESSION = {
  robotName: mockRobot.name,
  fileInfo: null,
  step: null,
  token: null,
  pathPrefix: null,
  stage: null,
  progress: null,
  error: null,
}

describe('robot update reducer', () => {
  const SPECS = [
    {
      name: 'handles robotUpdate:UPDATE_INFO for flex',
      action: {
        type: 'robotUpdate:UPDATE_INFO',
        payload: {
          version: '1.0.0',
          releaseNotes: 'release notes',
          target: 'flex',
        },
      },
      initialState: {
        ...INITIAL_STATE,
        ...{
          flex: {
            ...INITIAL_STATE.flex,
            releaseNotes: null,
            version: null,
            force: false,
          },
        },
      },
      expected: {
        ...INITIAL_STATE,
        flex: {
          ...INITIAL_STATE.flex,
          version: '1.0.0',
          releaseNotes: 'release notes',
          force: false,
        },
      },
    },
    {
      name: 'handles forced robotUpdate:UPDATE_VERSION for flex',
      action: {
        type: 'robotUpdate:UPDATE_VERSION',
        payload: {
          version: '1.0.0',
          target: 'flex',
          force: true,
        },
      },
      initialState: {
        ...INITIAL_STATE,
        ...{
          flex: {
            ...INITIAL_STATE.flex,
            version: null,
            force: true,
          },
        },
      },
      expected: {
        ...INITIAL_STATE,
        flex: {
          ...INITIAL_STATE.flex,
          version: '1.0.0',
          force: true,
        },
      },
    },

    {
      name: 'handles robotUpdate:UPDATE_INFO for ot2',
      action: {
        type: 'robotUpdate:UPDATE_INFO',
        payload: {
          version: '1.0.0',
          releaseNotes: 'release notes',
          target: 'ot2',
        },
      },
      initialState: {
        ...INITIAL_STATE,
        ...{
          ot2: {
            ...INITIAL_STATE.ot2,
            releaseNotes: null,
            version: null,
            force: false,
          },
        },
      },
      expected: {
        ...INITIAL_STATE,
        ot2: {
          ...INITIAL_STATE.ot2,
          version: '1.0.0',
          releaseNotes: 'release notes',
          force: false,
        },
      },
    },
    {
      name: 'handles forced robotUpdate:UPDATE_VERSION for ot2',
      action: {
        type: 'robotUpdate:UPDATE_VERSION',
        payload: {
          version: '1.0.0',
          target: 'ot2',
          force: true,
        },
      },
      initialState: {
        ...INITIAL_STATE,
        ...{
          ot2: {
            ...INITIAL_STATE.ot2,
            version: null,
            force: false,
          },
        },
      },
      expected: {
        ...INITIAL_STATE,
        ot2: {
          ...INITIAL_STATE.ot2,
          version: '1.0.0',
          force: true,
        },
      },
    },
    {
      name: 'handles robotUpdate:FILE_INFO',
      action: {
        type: 'robotUpdate:FILE_INFO',
        payload: {
          systemFile: '/path/to/system.zip',
          version: '1.0.0',
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
          fileInfo: {
            systemFile: '/path/to/system.zip',
            version: '1.0.0',
          },
        },
      },
    },
    {
      name: 'handles robotUpdate:DOWNLOAD_PROGRESS for flex',
      action: {
        type: 'robotUpdate:DOWNLOAD_PROGRESS',
        payload: { progress: 42, target: 'flex' },
      },
      initialState: {
        ...INITIAL_STATE,
        flex: {
          ...INITIAL_STATE.flex,
          downloadProgress: null,
        },
      },
      expected: {
        ...INITIAL_STATE,
        flex: {
          ...INITIAL_STATE.flex,
          downloadProgress: 42,
        },
      },
    },
    {
      name: 'handles robotUpdate:DOWNLOAD_PROGRESS for ot2',
      action: {
        type: 'robotUpdate:DOWNLOAD_PROGRESS',
        payload: { progress: 42, target: 'ot2' },
      },
      initialState: {
        ...INITIAL_STATE,
        ot2: {
          ...INITIAL_STATE.ot2,
          downloadProgress: null,
        },
      },
      expected: {
        ...INITIAL_STATE,
        ot2: {
          ...INITIAL_STATE.ot2,
          downloadProgress: 42,
        },
      },
    },
    {
      name: 'handles robotUpdate:DOWNLOAD_ERROR for flex',
      action: {
        type: 'robotUpdate:DOWNLOAD_ERROR',
        payload: { error: 'AH', target: 'flex' },
      },
      initialState: {
        ...INITIAL_STATE,
        flex: { ...INITIAL_STATE.flex, downloadError: null },
      },
      expected: {
        ...INITIAL_STATE,
        flex: { ...INITIAL_STATE.flex, downloadError: 'AH' },
      },
    },
    {
      name: 'handles robotUpdate:DOWNLOAD_ERROR for flex',
      action: {
        type: 'robotUpdate:DOWNLOAD_ERROR',
        payload: { error: 'AH', target: 'flex' },
      },
      initialState: {
        ...INITIAL_STATE,
        flex: { ...INITIAL_STATE.flex, downloadError: null },
      },
      expected: {
        ...INITIAL_STATE,
        flex: { ...INITIAL_STATE.flex, downloadError: 'AH' },
      },
    },
    {
      name: 'handles robotUpdate:START_UPDATE',
      action: {
        type: 'robotUpdate:START_UPDATE',
        payload: { robotName: mockRobot.name },
      },
      initialState: { ...INITIAL_STATE, session: null },
      expected: { ...INITIAL_STATE, session: BASE_SESSION },
    },
    {
      name: 'robotUpdate:START_UPDATE preserves file info',
      action: {
        type: 'robotUpdate:START_UPDATE',
        payload: { robotName: mockRobot.name },
      },
      initialState: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          robotName: mockRobot.name,
          fileInfo: {
            systemFile: 'system.zip',
            version: '1.0.0',
          },
        },
      },
      expected: {
        ...INITIAL_STATE,
        session: {
          ...BASE_SESSION,
          robotName: mockRobot.name,
          fileInfo: {
            systemFile: 'system.zip',
            version: '1.0.0',
          },
        },
      },
    },
    {
      name: 'handles robotUpdate:START_PREMIGRATION',
      action: {
        type: 'robotUpdate:START_PREMIGRATION',
        payload: { name: mockRobot.name, ip: '10.10.0.0', port: 31950 },
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, step: 'premigration' },
      },
    },
    {
      name: 'handles robotUpdate:PREMIGRATION_DONE',
      action: { type: 'robotUpdate:PREMIGRATION_DONE' },
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
      name: 'handles robotUpdate:CREATE_SESSION',
      action: {
        type: 'robotUpdate:CREATE_SESSION',
        payload: { host: mockRobot, sessionPath: '/session/update/begin' },
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, step: 'getToken' },
      },
    },
    {
      name: 'handles robotUpdate:CREATE_SESSION_SUCCESS',
      action: {
        type: 'robotUpdate:CREATE_SESSION_SUCCESS',
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
      name: 'handles robotUpdate:STATUS',
      action: {
        type: 'robotUpdate:STATUS',
        payload: { stage: 'writing', progress: 10, message: 'Writing file' },
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, stage: 'writing', progress: 10 },
      },
    },
    {
      name: 'handles robotUpdate:STATUS with error',
      action: {
        type: 'robotUpdate:STATUS',
        payload: { stage: 'error', error: 'error-type', message: 'AH!' },
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, stage: 'error', error: 'AH!' },
      },
    },
    {
      name: 'handles robotUpdate:UPLOAD_FILE',
      action: {
        type: 'robotUpdate:UPLOAD_FILE',
        payload: {
          host: { name: mockRobot.name },
          path: '/server/update/a-token/file',
          systemFile: '/some/system/file/somewhere',
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
      name: 'handles robotUpdate:FILE_UPLOAD_DONE',
      action: { type: 'robotUpdate:FILE_UPLOAD_DONE' },
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
      name: 'handles robotUpdate:CLEAR_SESSION',
      action: { type: 'robotUpdate:CLEAR_SESSION' },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: { ...INITIAL_STATE, session: null },
    },
    {
      name: 'handles robotUpdate:UNEXPECTED_ERROR',
      action: {
        type: 'robotUpdate:UNEXPECTED_ERROR',
        payload: { message: 'AH!' },
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, error: 'AH!' },
      },
    },
    {
      name: 'handles robotUpdate:PREMIGRATION_ERROR',
      action: {
        type: 'robotUpdate:PREMIGRATION_ERROR',
        payload: { message: 'AH!' },
      },
      initialState: { ...INITIAL_STATE, session: BASE_SESSION },
      expected: {
        ...INITIAL_STATE,
        session: { ...BASE_SESSION, error: 'AH!' },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, initialState, expected } = spec
    it(name, () =>
      expect(
        robotUpdateReducer(initialState as RobotUpdateState, action as Action)
      ).toEqual(expected)
    )
  })
})
