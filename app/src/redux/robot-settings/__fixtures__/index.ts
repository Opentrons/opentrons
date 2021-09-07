// robot settings fixtures

import { mockRobot } from '../../robot-api/__fixtures__'

import type { RobotSettings } from '../types'
import type {
  RobotApiResponse,
  RobotApiResponseMeta,
} from '../../robot-api/types'

export const mockRobotSettings: RobotSettings = [
  { id: 'foo', title: 'Foo', description: 'foobar', value: true },
  { id: 'bar', title: 'Bar', description: 'bazqux', value: false },
]

// fetch settings

export const mockFetchSettingsSuccessMeta: RobotApiResponseMeta = {
  method: 'GET',
  path: '/settings',
  ok: true,
  status: 200,
}

export const mockFetchSettingsSuccess: RobotApiResponse = {
  ...mockFetchSettingsSuccessMeta,
  host: mockRobot,
  body: {
    settings: mockRobotSettings,
    links: { restart: '/restart' },
  },
}

export const mockFetchSettingsFailureMeta: RobotApiResponseMeta = {
  method: 'GET',
  path: '/settings',
  ok: false,
  status: 500,
}

export const mockFetchSettingsFailure: RobotApiResponse = {
  ...mockFetchSettingsFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}

// update setting

export const mockUpdateSettingSuccessMeta: RobotApiResponseMeta = {
  method: 'POST',
  path: '/settings',
  ok: true,
  status: 200,
}

export const mockUpdateSettingSuccess: RobotApiResponse = {
  ...mockUpdateSettingSuccessMeta,
  host: mockRobot,
  body: {
    settings: mockRobotSettings,
    links: { restart: '/restart' },
  },
}

export const mockUpdateSettingFailureMeta: RobotApiResponseMeta = {
  method: 'POST',
  path: '/settings',
  ok: false,
  status: 500,
}

export const mockUpdateSettingFailure: RobotApiResponse = {
  ...mockUpdateSettingFailureMeta,
  host: mockRobot,
  body: { message: 'AH' },
}
