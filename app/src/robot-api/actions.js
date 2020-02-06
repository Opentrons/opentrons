// @flow
import * as Types from './types'
import * as Constants from './constants'

export const dismissRequest = (
  requestId: string
): Types.DismissRequestAction => ({
  type: Constants.DISMISS_REQUEST,
  payload: { requestId },
})
