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
  // If we're in ingredient detail mode, override the nav button page state
  const ingredDetailMode = labwareIngredSelectors.getSelectedContainer(state) &&
    !wellSelectionSelectors.wellSelectionModalData(state)
  const page = navigationRootSelector(state).page

  return ingredDetailMode ? 'ingredient-detail' : page
}
