import { mockRobot } from '../../robot-api/__fixtures__'
import * as actions from '../actions'

import type { RobotUpdateAction } from '../types'

interface ActionSpec {
  name: string
  creator: (...args: any[]) => RobotUpdateAction
  args: unknown[]
  expected: RobotUpdateAction
}

describe('robot update action creators', () => {
  const SPECS: ActionSpec[] = [
    {
      name: 'robotUpdate:UPDATE_IGNORED',
      creator: actions.robotUpdateIgnored,
      args: ['robot-name'],
      expected: {
        type: 'robotUpdate:UPDATE_IGNORED',
        meta: { robotName: 'robot-name' },
      },
    },
    {
      name: 'robotUpdate:CHANGELOG_SEEN',
      creator: actions.robotUpdateChangelogSeen,
      args: ['robot-name'],
      expected: {
        type: 'robotUpdate:CHANGELOG_SEEN',
        meta: { robotName: 'robot-name' },
      },
    },
    {
      name: 'robotUpdate:START_PREMIGRATION',
      creator: actions.startBuildrootPremigration,
      args: [mockRobot],
      expected: {
        type: 'robotUpdate:START_PREMIGRATION',
        payload: mockRobot,
        meta: { shell: true },
      },
    },
    {
      name: 'robotUpdate:START_UPDATE',
      creator: actions.startRobotUpdate,
      args: ['robot'],
      expected: {
        type: 'robotUpdate:START_UPDATE',
        payload: { robotName: 'robot', systemFile: null },
      },
    },
    {
      name: 'robotUpdate:START_UPDATE with user file',
      creator: actions.startRobotUpdate,
      args: ['robot', '/path/to/system.zip'],
      expected: {
        type: 'robotUpdate:START_UPDATE',
        payload: { robotName: 'robot', systemFile: '/path/to/system.zip' },
      },
    },
    {
      name: 'robotUpdate:CREATE_SESSION',
      creator: actions.createSession,
      args: [mockRobot, '/update/begin'],
      expected: {
        type: 'robotUpdate:CREATE_SESSION',
        payload: { host: mockRobot, sessionPath: '/update/begin' },
      },
    },
    {
      name: 'robotUpdate:CREATE_SESSION_SUCCESS',
      creator: actions.createSessionSuccess,
      args: [mockRobot, 'some-token', '/update'],
      expected: {
        type: 'robotUpdate:CREATE_SESSION_SUCCESS',
        payload: {
          host: mockRobot,
          token: 'some-token',
          pathPrefix: '/update',
        },
      },
    },
    {
      name: 'robotUpdate:STATUS',
      creator: actions.robotUpdateStatus,
      args: ['awaiting-file', 'Awaiting File', null],
      expected: {
        type: 'robotUpdate:STATUS',
        payload: {
          stage: 'awaiting-file',
          message: 'Awaiting File',
          progress: null,
        },
      },
    },
    {
      name: 'robotUpdate:SET_SESSION_STEP',
      creator: actions.setRobotUpdateSessionStep,
      args: ['restarting'],
      expected: {
        type: 'robotUpdate:SET_SESSION_STEP',
        payload: 'restarting',
      },
    },
    {
      name: 'robotUpdate:UNEXPECTED_ERROR',
      creator: actions.unexpectedRobotUpdateError,
      args: ['AH!'],
      expected: {
        type: 'robotUpdate:UNEXPECTED_ERROR',
        payload: { message: 'AH!' },
      },
    },
    {
      name: 'robotUpdate:READ_USER_FILE',
      creator: actions.readUserRobotUpdateFile,
      args: ['/some/path/to/ot2-system.zip'],
      expected: {
        type: 'robotUpdate:READ_USER_FILE',
        payload: { systemFile: '/some/path/to/ot2-system.zip' },
        meta: { shell: true },
      },
    },
    {
      name: 'robotUpdate:READ_SYSTEM_FILE',
      creator: actions.readSystemRobotUpdateFile,
      args: ['ot2'],
      expected: {
        type: 'robotUpdate:READ_SYSTEM_FILE',
        payload: { target: 'ot2' },
        meta: { shell: true },
      },
    },
    {
      name: 'robotUpdate:READ_SYSTEM_FILE',
      creator: actions.readSystemRobotUpdateFile,
      args: ['flex'],
      expected: {
        type: 'robotUpdate:READ_SYSTEM_FILE',
        payload: { target: 'flex' },
        meta: { shell: true },
      },
    },
    {
      name: 'robotUpdate:UPLOAD_FILE',
      creator: actions.uploadRobotUpdateFile,
      args: [mockRobot, '/server/update/token/file', '/path/to/some/file'],
      expected: {
        type: 'robotUpdate:UPLOAD_FILE',
        payload: {
          host: mockRobot,
          path: '/server/update/token/file',
          systemFile: '/path/to/some/file',
        },
        meta: { shell: true },
      },
    },
    {
      name: 'robotUpdate:UPLOAD_FILE with file specified',
      creator: actions.uploadRobotUpdateFile,
      args: [mockRobot, '/server/update/token/file', '/path/to/system.zip'],
      expected: {
        type: 'robotUpdate:UPLOAD_FILE',
        payload: {
          host: mockRobot,
          path: '/server/update/token/file',
          systemFile: '/path/to/system.zip',
        },
        meta: { shell: true },
      },
    },
    {
      name: 'robotUpdate:CLEAR_SESSION',
      creator: actions.clearRobotUpdateSession,
      args: [],
      expected: { type: 'robotUpdate:CLEAR_SESSION' },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
