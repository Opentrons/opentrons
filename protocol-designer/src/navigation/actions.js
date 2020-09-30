// @flow
import type { Page } from './types'

export type NavigateToPageAction = {| type: 'NAVIGATE_TO_PAGE', payload: Page |}
export const navigateToPage = (payload: Page): NavigateToPageAction => ({
  type: 'NAVIGATE_TO_PAGE',
  payload,
})

export type ToggleNewProtocolModalAction = {|
  type: 'TOGGLE_NEW_PROTOCOL_MODAL',
  payload: boolean,
|}
export const toggleNewProtocolModal = (
  payload: boolean
): ToggleNewProtocolModalAction => ({
  type: 'TOGGLE_NEW_PROTOCOL_MODAL',
  payload,
})
