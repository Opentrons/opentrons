// @flow
// mock HTTP responses for pipettes endpoints
import { mockRobot } from '../../robot-api/__fixtures__'

export const mockRestartSuccess = {
  host: mockRobot,
  method: 'POST',
  path: '/server/restart',
  ok: true,
  status: 200,
  body: { message: 'restarting in 1 second' },
}

export const mockRestartSuccessMeta = {
  method: 'POST',
  path: '/server/restart',
  ok: true,
  status: 200,
}

export const mockRestartFailure = {
  host: mockRobot,
  method: 'POST',
  path: '/server/restart',
  ok: false,
  status: 500,
  body: { message: 'AH' },
}

export const mockRestartFailureMeta = {
  method: 'POST',
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
  method: 'GET',
  path: '/settings/reset/options',
  ok: true,
  status: 200,
  body: { options: mockResetOptions },
}

export const mockFetchResetOptionsSuccessMeta = {
  method: 'GET',
  path: '/settings/reset/options',
  ok: true,
  status: 200,
}

export const mockFetchResetOptionsFailure = {
  host: mockRobot,
  method: 'GET',
  path: '/settings/reset/options',
  ok: false,
  status: 500,
  body: { message: 'AH' },
}

export const mockFetchResetOptionsFailureMeta = {
  method: 'GET',
  path: '/settings/reset/options',
  ok: false,
  status: 500,
}

export const mockResetConfigSuccess = {
  host: mockRobot,
  method: 'POST',
  path: '/settings/reset',
  ok: true,
  status: 200,
  body: ({}: { ... }),
}

export const mockResetConfigSuccessMeta = {
  method: 'POST',
  path: '/settings/reset',
  ok: true,
  status: 200,
}

export const mockResetConfigFailure = {
  host: mockRobot,
  method: 'POST',
  path: '/settings/reset',
  ok: false,
  status: 500,
  body: { message: 'AH' },
}

export const mockResetConfigFailureMeta = {
  method: 'POST',
  path: '/settings/reset',
  ok: false,
  status: 500,
}
