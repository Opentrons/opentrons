// @flow
import type {BaseState, Selector} from '../types'
// import {createSelector} from 'reselect'

import {rootSelector as navigationRootSelector} from './reducers'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import wellSelectionSelectors from '../well-selection/selectors'
// import {selectors as steplistSelectors} from '../steplist'

import type {Page} from './types'

export const newProtocolModal = (state: BaseState) =>
  navigationRootSelector(state).newProtocolModal

export const currentPage: Selector<Page> = (state: BaseState) => {
  let page = navigationRootSelector(state).page

  if (wellSelectionSelectors.wellSelectionModalData(state)) {
    page = 'well-selection-modal'
  } else if (labwareIngredSelectors.getSelectedContainer(state)) {
    page = 'ingredient-detail'
  }
  return page
}
