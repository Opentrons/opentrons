// @flow
// user support module
import { version } from './../package.json'
import { FF_PREFIX, getRobotAnalyticsData } from './analytics'
import { getConnectedRobot } from './discovery'
import { createLogger } from './logger'

import type { Action, ThunkAction, Middleware } from './types'
import type { BaseRobot } from './robot/types'
import type { Config } from './config/types'

type SupportConfig = $PropertyType<Config, 'support'>

type IntercomUpdate = { [string]: string | boolean | number }

const log = createLogger(__filename)

// pulled in from environment at build time
const INTERCOM_ID = process.env.OT_APP_INTERCOM_ID

// intercom user ID
let userId

// intercom handler (default noop)
const intercom = (...args) => {
  if (INTERCOM_ID && global.Intercom) {
    log.debug('Sending to Intercom', { args })
    global.Intercom(...args)
  }
}

// intercom api calls
const BOOT = 'boot'
const UPDATE = 'update'

// custom intercom properties
const APP_VERSION = 'App Version'
const ROBOT_NAME = 'Robot Name'
const ROBOT_API_VERSION = 'Robot API Version'
const ROBOT_SMOOTHIE_VERSION = 'Robot Smoothie Version'
const PIPETTE_MODEL_LEFT = 'Pipette Model Left'
const PIPETTE_MODEL_RIGHT = 'Pipette Model Right'
const FEATURE_FLAG = 'Robot FF'

export function initializeSupport(): ThunkAction {
  return (_, getState) => {
    const config = getState().config.support

    log.debug('Support config', { config })
    initializeIntercom(config)
  }
}

export const supportMiddleware: Middleware = store => next => action => {
  // hit reducers first to update state
  const result = next(action)
  const state = store.getState()
  const robot = getConnectedRobot(state)
  const robotData = getRobotAnalyticsData(state)

  if (robot && robotData && shouldUpdateIntercom(action, robot)) {
    const update: IntercomUpdate = {
      user_id: userId,
      [ROBOT_NAME]: robot.name,
      [ROBOT_API_VERSION]: robotData.robotApiServerVersion,
      [ROBOT_SMOOTHIE_VERSION]: robotData.robotSmoothieVersion,
      [PIPETTE_MODEL_LEFT]: robotData.robotLeftPipette,
      [PIPETTE_MODEL_RIGHT]: robotData.robotRightPipette,
    }

    // add connected robot feature flags to intercom profile
    Object.keys(robotData)
      .filter(key => key.startsWith(FF_PREFIX))
      .map(key => [key.slice(FF_PREFIX.length), robotData[key]])
      .forEach(([key, value]) => (update[`${FEATURE_FLAG} ${key}`] = value))

    log.debug('Intercom update', { action, update })
    intercom(UPDATE, update)
  }

  return result
}

function initializeIntercom(config: SupportConfig) {
  if (INTERCOM_ID) {
    userId = config.userId

    intercom(BOOT, {
      app_id: INTERCOM_ID,
      user_id: userId,
      created_at: config.createdAt,
      name: config.name,
      [APP_VERSION]: version,
    })
  }
}

function shouldUpdateIntercom(action: Action, robot: BaseRobot): boolean {
  // update intercom on new robot connect
  if (action.type === 'robot:CONNECT_RESPONSE') return true

  // also update if the robot has potentially new pipettes or advanced settings
  if (action.type === 'api:SUCCESS') {
    const { robot: reqRobot, path } = action.payload
    return (
      reqRobot.name === robot.name &&
      (path === 'pipettes' || path === 'settings')
    )
  }

  return false
}
