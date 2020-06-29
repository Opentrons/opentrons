// @flow
// robot settings fixtures

import { mockRobot } from '../../robot-api/__fixtures__'
import type { RobotSettings } from '../types'

export const mockRobotSettings: RobotSettings = [
  { id: 'foo', title: 'Foo', description: 'foobar', value: true },
  { id: 'bar', title: 'Bar', description: 'bazqux', value: false },
]

// fetch settings

export const mockFetchSettingsSuccessMeta = {
  method: 'GET',
  path: '/settings',
  ok: true,
  status: 200,
}

export const mockFetchSettingsSuccess = {
  ...mockFetchSettingsSuccessMeta,
  host: mockRobot,
  body: {
    settings: mockRobotSettings,
    links: { restart: '/restart' },
  },
}

export const mockFetchSettingsFailureMeta = {
  method: 'GET',
  path: '/settings',
  ok: false,
  status: 500,
}

export const mockFetchSettingsFailure = {
  ...mockFetchSettingsFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}

// update setting

export const mockUpdateSettingSuccessMeta = {
  method: 'POST',
  path: '/settings',
  ok: true,
  status: 200,
}

export const mockUpdateSettingSuccess = {
  ...mockUpdateSettingSuccessMeta,
  host: mockRobot,
  body: {
    settings: mockRobotSettings,
    links: { restart: '/restart' },
  },
}

export const mockUpdateSettingFailureMeta = {
  method: 'POST',
  path: '/settings',
  ok: false,
  status: 500,
}

export const mockUpdateSettingFailure = {
  ...mockUpdateSettingFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}
