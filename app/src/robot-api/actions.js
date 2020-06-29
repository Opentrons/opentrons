// @flow
import { DISMISS_REQUEST } from './constants'
import * as Types from './types'

export const dismissRequest = (
  requestId: string
): Types.DismissRequestAction => {
  return {
    type: DISMISS_REQUEST,
    payload: { requestId },
  }
}
