// @flow

import { mockRobot } from '../../robot-api/__fixtures__'

// POST /robot/home

export const mockHomeSuccessMeta = {
  method: 'POST',
  path: '/robot/home',
  ok: true,
  status: 200,
}

export const mockHomeSuccess = {
  ...mockHomeSuccessMeta,
  host: mockRobot,
  body: { message: 'Robot homed successfully.' },
}

export const mockHomeFailureMeta = {
  method: 'POST',
  path: '/robot/home',
  ok: false,
  status: 500,
}

export const mockHomeFailure = {
  ...mockHomeFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}
