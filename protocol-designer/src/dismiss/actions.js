// @flow
import type {CommandCreatorWarning} from '../step-generation'
import type {FormWarning} from '../steplist'

export type DismissAction<ActionType, WarningType> = {
  type: ActionType,
  payload: {
    warning: WarningType,
    stepId: ?number,
  },
}

export type DismissFormWarning = DismissAction<'DISMISS_FORM_WARNING', FormWarning>
export type DismissTimelineWarning = DismissAction<'DISMISS_TIMELINE_WARNING', CommandCreatorWarning>

export const dismissFormWarning = (
  payload: $PropertyType<DismissFormWarning, 'payload'>
): DismissFormWarning => ({
  type: 'DISMISS_FORM_WARNING',
  payload,
})

export const dismissTimelineWarning = (
  payload: $PropertyType<DismissTimelineWarning, 'payload'>
): DismissTimelineWarning => ({
  type: 'DISMISS_TIMELINE_WARNING',
  payload,
})
