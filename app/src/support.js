// @flow
// user support module
import noop from 'lodash/noop'

import {version} from './../package.json'
import createLogger from './logger'

import type {ThunkAction, Middleware} from './types'
import type {Config} from './config'

type SupportConfig = $PropertyType<Config, 'support'>

const log = createLogger(__filename)

// pulled in from environment at build time
const INTERCOM_ID = process.env.OT_APP_INTERCOM_ID

// intercom handler (default noop)
let intercom = noop
let userId
let robot

export function initializeSupport (): ThunkAction {
  return (_, getState) => {
    const config = getState().config.support

    log.debug('Support config', {config})
    initializeIntercom(config)
  }
}

export const supportMiddleware: Middleware = (store) => (next) => (action) => {
  if (action.type === 'robot:CONNECT_RESPONSE') {
    const state = store.getState()
    robot = state.robot.connection.connectRequest.name
    log.debug('Updating intercom data', {user_id: userId, robot})
    intercom('update', {user_id: userId, 'Robot Name': robot})
  }

  return next(action)
}

function initializeIntercom (config: SupportConfig) {
  if (INTERCOM_ID) {
    userId = config.userId

    const data = {
      app_id: INTERCOM_ID,
      user_id: userId,
      created_at: config.createdAt,
      name: config.name,
      'App Version': version,
      'Robot Name': robot
    }

    log.debug('Initializing Intercom', {data})
    intercom = global.Intercom || intercom
    intercom('boot', data)
  }
}
