// @flow
import {
  getArgsAndErrorsByStepId,
  getPipetteEntities,
} from '../step-forms/selectors'
import { getFileMetadata } from '../file-data/selectors'
import { trackEvent } from './mixpanel'
import { getHasOptedIn } from './selectors'
import { flattenNestedProperties } from './utils/flattenNestedProperties'
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
    const { stepArgs } = argsAndErrors

    if (stepArgs !== null) {
      const pipetteEntities = getPipetteEntities(state)
      const fileMetadata = getFileMetadata(state)
      const dateCreatedTimestamp = fileMetadata.created

      // additional fields for analytics, eg descriptive name for pipettes
      // (these fields are prefixed with double underscore only to make sure they
      // never accidentally overlap with actual fields)
      const additionalProperties = flattenNestedProperties(stepArgs)

      // Mixpanel wants YYYY-MM-DDTHH:MM:SS for Date type
      additionalProperties.__dateCreated =
        dateCreatedTimestamp != null && Number.isFinite(dateCreatedTimestamp)
          ? new Date(dateCreatedTimestamp).toISOString()
          : null

      additionalProperties.__protocolName = fileMetadata.protocolName

      if (stepArgs.pipette) {
        additionalProperties.__pipetteName =
          pipetteEntities[(stepArgs?.pipette)].name
      }

      return {
        name: 'saveStep',
        properties: { ...stepArgs, ...additionalProperties },
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
