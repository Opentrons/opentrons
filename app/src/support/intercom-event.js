// @flow
// functions for sending events to intercom, both for enriching user profiles
// and for triggering contextual support conversations
import type { Action, State } from '../types'
import { sendIntercomEvent } from './intercom-binding'
import type { IntercomEvent } from './types'
import { INTERCOM_EVENT_NO_CAL_BLOCK } from './constants'
import * as Config from '../config'

export function makeIntercomEvent(
  action: Action,
  state: State
): IntercomEvent | null {
  switch (action.type) {
    case Config.UPDATE_VALUE: {
      const { path, value } = action.payload
      if (path !== 'calibration.useTrashSurfaceForTipCal' || value !== true) {
        return null
      }
      return {
        eventName: INTERCOM_EVENT_NO_CAL_BLOCK,
        metadata: {},
      }
    }
  }
  return null
}

export function sendEvent(event: IntercomEvent): void {
  sendIntercomEvent(event.eventName, event?.metadata ?? {})
}
