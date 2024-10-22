import { DISMISS_ALL_REQUESTS, DISMISS_REQUEST } from './constants'
import type * as Types from './types'

export const dismissRequest = (
  requestId: string
): Types.DismissRequestAction => {
  return {
    type: DISMISS_REQUEST,
    payload: { requestId },
  }
}

export const dismissAllRequests = (): Types.DismissAllRequestsAction => {
  return { type: DISMISS_ALL_REQUESTS }
}
