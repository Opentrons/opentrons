// @flow
import type {Page} from './types'

export const navigateToPage = (payload: Page) => ({
  type: 'NAVIGATE_TO_PAGE',
  payload
})
