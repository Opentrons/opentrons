// @flow
// functions for managing the binding to the Intercom js api

import { createLogger } from '../logger'
import type { IntercomPayload } from './types'
import * as Constants from './constants'

const log = createLogger(__filename)
let userId: string | null = null

export const setUserId = (newUserId: string | null): void => {
  userId = newUserId
}

// pulled in from environment at build time
export const getIntercomAppId = (): ?string => process.env.OT_APP_INTERCOM_ID

const okToCall = (): boolean => {
  return !!getIntercomAppId() && !!global.Intercom && !!userId
}

export const bootIntercom = (props: IntercomPayload): void => {
  if (okToCall()) {
    const iprops = {
      ...props,
      user_id: userId,
    }
    log.debug('Booting intercom', props)
    global.Intercom(Constants.INTERCOM_BOOT, iprops)
  }
}

export const updateIntercomProfile = (props: IntercomPayload): void => {
  if (okToCall()) {
    const iprops = {
      ...props,
      user_id: userId,
    }
    log.debug('Updating intercom profile', props)
    global.Intercom(Constants.INTERCOM_UPDATE, iprops)
  }
}

export const sendIntercomEvent = (
  eventName: string,
  metadata: IntercomPayload
): void => {
  if (okToCall()) {
    log.debug('Sending intercom event', { eventName, metadata })
    global.Intercom(Constants.INTERCOM_TRACK_EVENT, eventName, metadata)
  }
}
