// @flow
import type {BaseState, Selector} from '../types'
import {rootSelector as navigationRootSelector} from './reducers'

import type {Page} from './types'

export const newProtocolModal = (state: BaseState) =>
  navigationRootSelector(state).newProtocolModal

export const currentPage: Selector<Page> = (state: BaseState) => {
  let page = navigationRootSelector(state).page

  return page
}
