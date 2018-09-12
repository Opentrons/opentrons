// @flow
// user support module
import {version} from './../package.json'
import createLogger from './logger'

import type {ThunkAction, Middleware} from './types'
import type {Config} from './config'

type SupportConfig = $PropertyType<Config, 'support'>

const log = createLogger(__filename)

// pulled in from environment at build time
const INTERCOM_ID = process.env.OT_APP_INTERCOM_ID

// intercom user ID
let userId

// intercom handler (default noop)
const intercom = (...args) => {
  if (INTERCOM_ID && global.Intercom) {
    log.debug('Sending to Intercom', {args})
    global.Intercom(...args)
  }
}

// intercom api calls
const BOOT = 'boot'
const UPDATE = 'update'

// custom intercom properties
const APP_VERSION = 'App Version'
const ROBOT_NAME = 'Robot Name'
const PIPETTE_MODEL_LEFT = 'Pipette Model Left'
const PIPETTE_MODEL_RIGHT = 'Pipette Model Right'

export function initializeSupport (): ThunkAction {
  return (_, getState) => {
    const config = getState().config.support

    log.debug('Support config', {config})
    initializeIntercom(config)
  }
}

export const supportMiddleware: Middleware = (store) => (next) => (action) => {
  let update

  if (action.type === 'robot:CONNECT_RESPONSE') {
    const state = store.getState()
    const robot = state.robot.connection.connectRequest.name

    update = {[ROBOT_NAME]: robot}
  } else if (action.type === 'api:PIPETTES_SUCCESS') {
    const state = store.getState()

    if (state.robot.connection.connectedTo === action.payload.robot.name) {
      const {left, right} = action.payload.pipettes

      update = {
        [PIPETTE_MODEL_LEFT]: left.model,
        [PIPETTE_MODEL_RIGHT]: right.model,
      }
    }
  }

  if (update) intercom(UPDATE, {user_id: userId, ...update})

  return next(action)
}

function initializeIntercom (config: SupportConfig) {
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
