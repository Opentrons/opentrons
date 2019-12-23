// @flow

import { mockRobot } from '../../robot-api/__fixtures__'

// POST /robot/move

export const mockMoveSuccessMeta = {
  method: 'POST',
  path: '/robot/move',
  ok: true,
  status: 200,
}

export const mockMoveSuccess = {
  ...mockMoveSuccessMeta,
  host: mockRobot,
  body: { message: 'Move complete. New position: [1, 2, 3]' },
}

export const mockMoveFailureMeta = {
  method: 'POST',
  path: '/robot/move',
  ok: false,
  status: 500,
}

export const mockMoveFailure = {
  ...mockMoveFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}

// GET /robot/positions

export const mockPositions = {
  change_pipette: {
    target: 'mount',
    left: [325, 40, 30],
    right: [65, 40, 30],
  },
  attach_tip: {
    target: 'pipette',
    point: [200, 90, 150],
  },
}

export const mockFetchPositionsSuccessMeta = {
  method: 'GET',
  path: '/robot/positions',
  ok: true,
  status: 200,
}

export const mockFetchPositionsSuccess = {
  ...mockFetchPositionsSuccessMeta,
  host: mockRobot,
  body: {
    positions: mockPositions,
  },
}

export const mockFetchPositionsFailureMeta = {
  method: 'GET',
  path: '/robot/positions',
  ok: false,
  status: 500,
}

export const mockFetchPositionsFailure = {
  ...mockFetchPositionsFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}

// POST /motors/disengage

export const mockDisengageMotorsSuccessMeta = {
  method: 'POST',
  path: '/motors/disengage',
  ok: true,
  status: 200,
}

export const mockDisengageMotorsSuccess = {
  ...mockDisengageMotorsSuccessMeta,
  host: mockRobot,
  body: { message: 'Disengaged axes: [a, b, c, x, y, z]' },
}

export const mockDisengageMotorsFailureMeta = {
  method: 'POST',
  path: '/motors/disengage',
  ok: false,
  status: 500,
}

export const mockDisengageMotorsFailure = {
  ...mockDisengageMotorsFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}
