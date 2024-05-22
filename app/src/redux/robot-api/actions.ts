import { DISMISS_REQUEST } from './constants'
import type * as Types from './types'

export const dismissRequest = (
  requestId: string
): Types.DismissRequestAction => {
  return {
    type: DISMISS_REQUEST,
    payload: { requestId },
  }
}
