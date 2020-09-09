// @flow
import { trackEvent } from './mixpanel'
import { getHasOptedIn } from './selectors'
import { getArgsAndErrorsByStepId } from '../step-forms/selectors'
import type { Middleware } from 'redux'
import type { BaseState } from '../types'
import type { SaveStepFormAction } from '../ui/steps/actions/thunks'
import type { AnalyticsEventAction } from './actions'
import type { AnalyticsEvent } from './mixpanel'

// Converts Redux actions to analytics events (read: Mixpanel events).
// Returns null if there is no analytics event associated with the action,
// which happens for most actions.
export const reduxActionToAnalyticsEvent = (
  state: BaseState,
  action: any
): AnalyticsEvent | null => {
  if (action.type === 'SAVE_STEP_FORM') {
    // create the "saveStep" action, taking advantage of the formToArgs machinery
    // to get nice cleaned-up data instead of the raw form data.
    const a: SaveStepFormAction = action
    const argsAndErrors = getArgsAndErrorsByStepId(state)[a.payload.id]
    if (argsAndErrors.stepArgs !== null) {
      return {
        name: 'saveStep',
        // TODO IMMEDIATELY: add human-readable pipette info instead of UUID?
        properties: argsAndErrors.stepArgs,
      }
    }
  }
  if (action.type === 'ANALYTICS_EVENT') {
    const a: AnalyticsEventAction = action
    return a.payload
  }
  return null
}

export const trackEventMiddleware: Middleware<BaseState, any> = ({
  getState,
  dispatch,
}) => next => action => {
  const result = next(action)

  // NOTE: this is the Redux state AFTER the action has been fully dispatched
  const state = getState()

  const optedIn = getHasOptedIn(state) || false
  const event = reduxActionToAnalyticsEvent(state, action)
  if (event) {
    // actually report to analytics (trackEvent is responsible for using optedIn)
    trackEvent(event, optedIn)
  }
  return result
}
