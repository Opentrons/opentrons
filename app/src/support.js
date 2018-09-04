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
    const robot = state.robot.connection.connectRequest.name

    intercom('update', {user_id: userId, 'Robot Name': robot})
  }

  return next(action)
}

function initializeIntercom (config: SupportConfig) {
  if (INTERCOM_ID) {
    userId = config.userId

    intercom('boot', {
      app_id: INTERCOM_ID,
      user_id: userId,
      created_at: config.createdAt,
      name: config.name,
      'App Version': version
    })
  }
}
