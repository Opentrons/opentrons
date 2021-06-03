// @flow
import type { StepIdType } from '../form-types'

export type DismissAction<ActionType> = {
  type: ActionType,
  payload: {
    type: string,
    stepId: StepIdType,
  },
}

export type DismissFormWarning = DismissAction<'DISMISS_FORM_WARNING'>
export type DismissTimelineWarning = DismissAction<'DISMISS_TIMELINE_WARNING'>

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
