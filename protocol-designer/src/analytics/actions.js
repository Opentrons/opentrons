// @flow
import {initializeAnalytics, shutdownAnalytics} from './integrations'

export type SetOptIn = {
  type: 'SET_OPT_IN',
  payload: boolean,
}

const _setOptIn = (payload: $PropertyType<SetOptIn, 'payload'>): SetOptIn => {
  // side effects
  if (payload) {
    initializeAnalytics()
  } else {
    shutdownAnalytics()
  }

  return {
    type: 'SET_OPT_IN',
    payload,
  }
}

export const optIn = () => _setOptIn(true)
export const optOut = () => _setOptIn(false)
