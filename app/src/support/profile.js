// @flow
// functions for managing the user's Intercom profile
import { version as appVersion } from '../../package.json'
import { FF_PREFIX, getRobotAnalyticsData } from '../analytics'
import { getConnectedRobot } from '../discovery'
import {
  getIntercomAppId,
  bootIntercom,
  updateIntercomProfile,
  setUserId,
} from './intercom-binding'
import * as Pipettes from '../pipettes'
import * as RobotSettings from '../robot-settings'
import * as SystemInfo from '../system-info'
import * as Constants from './constants'

import type { Action, State } from '../types'
import type { Config } from '../config/types'
import type { SupportProfileUpdate } from './types'

type SupportConfig = $PropertyType<Config, 'support'>

export function initializeProfile(config: SupportConfig): void {
  setUserId(config.userId)

  bootIntercom({
    app_id: getIntercomAppId(),
    created_at: config.createdAt,
    [Constants.PROFILE_APP_VERSION]: appVersion,
  })
}

export function updateProfile(update: SupportProfileUpdate): void {
  updateIntercomProfile(update)
}

export function makeProfileUpdate(
  action: Action,
  state: State
): SupportProfileUpdate | null {
  switch (action.type) {
    // TODO(mc, 2020-04-21): this code is not covered by unit tests and sets
    // too much data in one go. Refactor to handle each action individually
    case 'robot:CONNECT_RESPONSE':
    case RobotSettings.FETCH_SETTINGS_SUCCESS:
    case RobotSettings.UPDATE_SETTING_SUCCESS:
    case Pipettes.FETCH_PIPETTES_SUCCESS: {
      const robot = getConnectedRobot(state)
      const robotData = getRobotAnalyticsData(state)

      // only update profile if we've just connected to a robot or
      // an /settings or /pipettes call just succeeded with the currently
      // connected robot
      if (
        !robot ||
        !robotData ||
        (action.type !== 'robot:CONNECT_RESPONSE' &&
          action.payload.robotName !== robot.name)
      ) {
        return null
      }

      const update: SupportProfileUpdate = {
        [Constants.PROFILE_ROBOT_NAME]: robot.name,
        [Constants.PROFILE_ROBOT_API_VERSION]: robotData.robotApiServerVersion,
        [Constants.PROFILE_ROBOT_SMOOTHIE_VERSION]:
          robotData.robotSmoothieVersion,
        [Constants.PROFILE_PIPETTE_MODEL_LEFT]: robotData.robotLeftPipette,
        [Constants.PROFILE_PIPETTE_MODEL_RIGHT]: robotData.robotRightPipette,
      }

      // add connected robot feature flags to intercom profile
      Object.keys(robotData)
        .filter(key => key.startsWith(FF_PREFIX))
        .map(key => [key.slice(FF_PREFIX.length), robotData[key]])
        .forEach(
          ([key, value]) =>
            (update[`${Constants.PROFILE_FEATURE_FLAG} ${key}`] = value)
        )

      return update
    }

    case SystemInfo.INITIALIZED:
    case SystemInfo.USB_DEVICE_ADDED:
    case SystemInfo.NETWORK_INTERFACES_CHANGED: {
      return SystemInfo.getU2EDeviceAnalyticsProps(state)
    }
  }
  return null
}
