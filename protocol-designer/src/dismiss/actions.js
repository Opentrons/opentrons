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
  payload: $PropertyType<DismissWarning, 'payload'>
): DismissWarning => ({
  type: 'DISMISS_WARNING',
  payload
})
