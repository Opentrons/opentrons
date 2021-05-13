// @flow
import * as Types from './types'
import { DISMISS_REQUEST } from './constants'

export const dismissRequest = (
  requestId: string
): Types.DismissRequestAction => {
  return {
    type: DISMISS_REQUEST,
    payload: { requestId },
  }
}
