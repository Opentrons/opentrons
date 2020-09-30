// @flow
// functions for sending events to intercom, both for enriching user profiles
// and for triggering contextual support conversations
import type { Action, State } from '../types'
import { sendIntercomEvent } from './intercom-binding'
import type { IntercomEvent } from './types'
import { INTERCOM_EVENT_CALCHECK_COMPLETE } from './constants'
import * as Sessions from '../sessions'

export function makeIntercomEvent(
  action: Action,
  state: State
): IntercomEvent | null {
  switch (action.type) {
    case Sessions.DELETE_SESSION: {
      const { robotName, sessionId } = action.payload
      const eventProps = Sessions.getIntercomEventPropsForRobotSessionById(
        state,
        robotName,
        sessionId
      )
      if (eventProps === null) {
        return null
      }
      return {
        eventName: INTERCOM_EVENT_CALCHECK_COMPLETE,
        metadata: eventProps,
      }
    }
  }
  return null
}

export function sendEvent(event: IntercomEvent): void {
  sendIntercomEvent(event.eventName, event?.metadata ?? {})
}
