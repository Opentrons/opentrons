// @flow
import type { Page } from './types'

export type NavigateToPageAction = {| type: 'NAVIGATE_TO_PAGE', payload: Page |}

export const navigateToPage = (payload: Page): NavigateToPageAction => ({
  type: 'NAVIGATE_TO_PAGE',
  payload,
})

export const toggleNewProtocolModal = (payload: boolean) => ({
  type: 'TOGGLE_NEW_PROTOCOL_MODAL',
  payload,
})
