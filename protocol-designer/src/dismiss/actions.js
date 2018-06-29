// @flow
import type {CommandCreatorWarning} from '../step-generation'

type DismissWarning = {
  type: 'DISMISS_WARNING',
  payload: {
    warning: CommandCreatorWarning,
    stepId: number
  }
}
export const dismissWarning = (
  payload: $ElementType<DismissWarning, 'payload'>
): DismissWarning => ({
  type: 'DISMISS_WARNING',
  payload
})
