// mock HTTP responses for pipettes endpoints
import { mockRobot } from '../../robot-api/__fixtures__'
import type { Method } from '../../robot-api/types'

export * from './system-time'

export const mockRestartSuccess = {
  host: mockRobot,
  method: 'POST' as Method,
  path: '/server/restart',
  ok: true,
  status: 200,
  body: { message: 'restarting in 1 second' },
}

export const mockRestartSuccessMeta = {
  method: 'POST' as Method,
  path: '/server/restart',
  ok: true,
  status: 200,
}

export const mockRestartFailure = {
  host: mockRobot,
  method: 'POST' as Method,
  path: '/server/restart',
  ok: false,
  status: 500,
  body: { message: 'AH' },
}

export const mockRestartFailureMeta = {
  method: 'POST' as Method,
  path: '/server/restart',
  ok: false,
  status: 500,
}

export const mockResetOptions = [
  { id: 'foo', name: 'Foo', description: 'foobar' },
  { id: 'bar', name: 'Bar', description: 'barfoo' },
]

export const mockFetchResetOptionsSuccess = {
  host: mockRobot,
  method: 'GET' as Method,
  path: '/settings/reset/options',
  ok: true,
  status: 200,
  body: { options: mockResetOptions },
}

export const mockFetchResetOptionsSuccessMeta = {
  method: 'GET' as Method,
  path: '/settings/reset/options',
  ok: true,
  status: 200,
}

export const mockFetchResetOptionsFailure = {
  host: mockRobot,
  method: 'GET' as Method,
  path: '/settings/reset/options',
  ok: false,
  status: 500,
  body: { message: 'AH' },
}

export const mockFetchResetOptionsFailureMeta = {
  method: 'GET' as Method,
  path: '/settings/reset/options',
  ok: false,
  status: 500,
}

export const mockResetConfigSuccess = {
  host: mockRobot,
  method: 'POST' as Method,
  path: '/settings/reset',
  ok: true,
  status: 200,
  body: {},
}

export const mockResetConfigSuccessMeta = {
  method: 'POST' as Method,
  path: '/settings/reset',
  ok: true,
  status: 200,
}

export const mockResetConfigFailure = {
  host: mockRobot,
  method: 'POST' as Method,
  path: '/settings/reset',
  ok: false,
  status: 500,
  body: { message: 'AH' },
}

export const mockResetConfigFailureMeta = {
  method: 'POST' as Method,
  path: '/settings/reset',
  ok: false,
  status: 500,
}
