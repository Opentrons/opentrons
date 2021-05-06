// mock HTTP responses for /robot/lights endpoints

import { mockRobot } from '../../robot-api/__fixtures__'
import type { Method } from '../../robot-api/types'

// GET /robot/lights

export const mockFetchLightsSuccessMeta = {
  method: 'GET' as Method,
  path: '/robot/lights',
  ok: true,
  status: 200,
}

export const mockFetchLightsSuccess = {
  ...mockFetchLightsSuccessMeta,
  host: mockRobot,
  body: { on: false },
}

export const mockFetchLightsFailureMeta = {
  method: 'GET' as Method,
  path: '/robot/lights',
  ok: false,
  status: 500,
}

export const mockFetchLightsFailure = {
  ...mockFetchLightsFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}

// POST /robot/lights

export const mockUpdateLightsSuccessMeta = {
  method: 'POST' as Method,
  path: '/robot/lights',
  ok: true,
  status: 200,
}

export const mockUpdateLightsSuccess = {
  ...mockUpdateLightsSuccessMeta,
  host: mockRobot,
  body: { on: true },
}

export const mockUpdateLightsFailureMeta = {
  method: 'POST' as Method,
  path: '/robot/lights',
  ok: false,
  status: 500,
}

export const mockUpdateLightsFailure = {
  ...mockUpdateLightsFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}
