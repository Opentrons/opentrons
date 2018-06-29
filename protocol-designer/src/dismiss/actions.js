// @flow
import type {DismissInfo} from './types'

type DismissWarning = {
  type: 'DISMISS_WARNING',
  payload: DismissInfo
}
export const dismissWarning = (payload: DismissInfo): DismissWarning => ({
  type: 'DISMISS_WARNING',
  payload
})
