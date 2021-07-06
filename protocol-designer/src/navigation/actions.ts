import { Page } from './types'
export interface NavigateToPageAction {
  type: 'NAVIGATE_TO_PAGE'
  payload: Page
}
export const navigateToPage = (payload: Page): NavigateToPageAction => ({
  type: 'NAVIGATE_TO_PAGE',
  payload,
})
export interface ToggleNewProtocolModalAction {
  type: 'TOGGLE_NEW_PROTOCOL_MODAL'
  payload: boolean
}
export const toggleNewProtocolModal = (
  payload: boolean
): ToggleNewProtocolModalAction => ({
  type: 'TOGGLE_NEW_PROTOCOL_MODAL',
  payload,
})
