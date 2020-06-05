// @flow
import { initializeFullstory, shutdownFullstory } from './fullstory'

export type SetOptIn = {|
  type: 'SET_OPT_IN',
  payload: boolean,
|}

const _setOptIn = (payload: $PropertyType<SetOptIn, 'payload'>): SetOptIn => {
  // side effects
  if (payload) {
    initializeFullstory()
  } else {
    shutdownFullstory()
  }

  return {
    type: 'SET_OPT_IN',
    payload,
  }
}

export const optIn = (): SetOptIn => _setOptIn(true)
export const optOut = (): SetOptIn => _setOptIn(false)
