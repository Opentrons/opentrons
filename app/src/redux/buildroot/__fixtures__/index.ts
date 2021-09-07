import { mockRobot } from '../../robot-api/__fixtures__'

import type { RobotApiResponse } from '../../robot-api/types'

export {
  mockRestartSuccess,
  mockRestartFailure,
} from '../../robot-admin/__fixtures__'

// POST /server/update/begin

export const mockUpdateBeginSuccess: RobotApiResponse = {
  method: 'POST',
  path: '/server/update/begin',
  ok: true,
  status: 201,
  host: mockRobot,
  body: { token: 'foobar' },
}

export const mockUpdateBeginConflict: RobotApiResponse = {
  method: 'POST',
  path: '/server/update/begin',
  ok: false,
  status: 409,
  host: mockRobot,
  body: { message: 'Session in progress' },
}

export const mockUpdateBeginFailure: RobotApiResponse = {
  method: 'POST',
  path: '/server/update/begin',
  ok: false,
  status: 500,
  host: mockRobot,
  body: { message: 'AH' },
}

export const mockUpdateCancelSuccess: RobotApiResponse = {
  method: 'POST',
  path: '/server/update/cancel',
  ok: true,
  status: 200,
  host: mockRobot,
  body: { message: 'cancelled' },
}

export const mockUpdateCancelFailure: RobotApiResponse = {
  method: 'POST',
  path: '/server/update/cancel',
  ok: false,
  status: 500,
  host: mockRobot,
  body: { message: 'AH' },
}

export const mockStatusSuccess: RobotApiResponse = {
  method: 'GET',
  path: '/server/update/foobar/status',
  ok: true,
  status: 200,
  host: mockRobot,
  body: { stage: 'awaiting-file', message: 'Awaiting File', progress: 0.1 },
}

export const mockCommitSuccess: RobotApiResponse = {
  method: 'POST',
  path: '/server/update/foobar/commit',
  ok: true,
  status: 200,
  host: mockRobot,
  body: { message: 'Committed' },
}

export const mockCommitFailure: RobotApiResponse = {
  method: 'POST',
  path: '/server/update/foobar/commit',
  ok: false,
  status: 500,
  host: mockRobot,
  body: { message: 'AH' },
}
