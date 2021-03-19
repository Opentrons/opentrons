// @flow
import { mockRobot } from '../../robot-api/__fixtures__'
import * as actions from '../actions'

import type { BuildrootAction } from '../types'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => BuildrootAction,
  args: Array<mixed>,
  expected: BuildrootAction,
|}

describe('buildroot action creators', () => {
  const SPECS: Array<ActionSpec> = [
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
      args: [mockRobot],
      expected: {
        type: 'buildroot:START_PREMIGRATION',
        payload: mockRobot,
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
      name: 'buildroot:CREATE_SESSION',
      creator: actions.createSession,
      args: [mockRobot, '/update/begin'],
      expected: {
        type: 'buildroot:CREATE_SESSION',
        payload: { host: mockRobot, sessionPath: '/update/begin' },
      },
    },
    {
      name: 'buildroot:CREATE_SESSION_SUCCESS',
      creator: actions.createSessionSuccess,
      args: [mockRobot, 'some-token', '/update'],
      expected: {
        type: 'buildroot:CREATE_SESSION_SUCCESS',
        payload: {
          host: mockRobot,
          token: 'some-token',
          pathPrefix: '/update',
        },
      },
    },
    {
      name: 'buildroot:STATUS',
      creator: actions.buildrootStatus,
      args: ['awaiting-file', 'Awaiting File', null],
      expected: {
        type: 'buildroot:STATUS',
        payload: {
          stage: 'awaiting-file',
          message: 'Awaiting File',
          progress: null,
        },
      },
    },
    {
      name: 'buildroot:SET_SESSION_STEP',
      creator: actions.setBuildrootSessionStep,
      args: ['restarting'],
      expected: {
        type: 'buildroot:SET_SESSION_STEP',
        payload: 'restarting',
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
      args: [mockRobot, '/server/update/token/file', null],
      expected: {
        type: 'buildroot:UPLOAD_FILE',
        payload: {
          host: mockRobot,
          path: '/server/update/token/file',
          systemFile: null,
        },
        meta: { shell: true },
      },
    },
    {
      name: 'buildroot:UPLOAD_FILE with file specified',
      creator: actions.uploadBuildrootFile,
      args: [mockRobot, '/server/update/token/file', '/path/to/system.zip'],
      expected: {
        type: 'buildroot:UPLOAD_FILE',
        payload: {
          host: mockRobot,
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
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
