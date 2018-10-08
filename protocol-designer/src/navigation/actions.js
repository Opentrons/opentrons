// @flow
import type {Page} from './types'

export const navigateToPage = (payload: Page) => ({
  type: 'NAVIGATE_TO_PAGE',
  payload,
})

export const toggleNewProtocolModal = (payload: boolean) => ({
  type: 'TOGGLE_NEW_PROTOCOL_MODAL',
  payload,
})
