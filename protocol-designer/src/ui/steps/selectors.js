// @flow
import {createSelector} from 'reselect'
import last from 'lodash/last'

import {selectors as steplistSelectors} from '../../steplist'
import {initialSelectedItemState} from './reducers'
import type {RootState, SelectableItem} from './reducers'
import type {BaseState, Selector} from '../types'

import type {
  FormSectionState,
  SubstepIdentifier,
  TerminalItemId,
} from './types'

import type {StepIdType} from '../form-types'

const rootSelector = (state: BaseState): RootState => state.steplist

// ======= Selectors ===============================================

/** fallbacks for selectedItem reducer, when null */
const getNonNullSelectedItem: Selector<SelectableItem> = createSelector(
  rootSelector,
  (state: RootState) => {
    if (state.selectedItem != null) return state.selectedItem
    if (state.orderedSteps.length > 0) return {isStep: true, id: last(state.orderedSteps)}
    return initialSelectedItemState
  }
)

const getSelectedStepId: Selector<?StepIdType> = createSelector(
  getNonNullSelectedItem,
  (item) => item.isStep ? item.id : null
)

const getSelectedTerminalItemId: Selector<?TerminalItemId> = createSelector(
  getNonNullSelectedItem,
  (item) => !item.isStep ? item.id : null
)

const getHoveredItem: Selector<?SelectableItem> = createSelector(
  rootSelector,
  (state: RootState) => state.hoveredItem
)

const getHoveredStepId: Selector<?StepIdType> = createSelector(
  getHoveredItem,
  (item) => (item && item.isStep) ? item.id : null
)

const getHoveredTerminalItemId: Selector<?TerminalItemId> = createSelector(
  getHoveredItem,
  (item) => (item && !item.isStep) ? item.id : null
)

const getHoveredSubstep: Selector<SubstepIdentifier> = createSelector(
  rootSelector,
  (state: RootState) => state.hoveredSubstep
)

// Hovered or selected item. Hovered has priority.
// Uses fallback of getNonNullSelectedItem if not hovered or selected
const getActiveItem: Selector<SelectableItem> = createSelector(
  getNonNullSelectedItem,
  getHoveredItem,
  (selected, hovered) => hovered != null
    ? hovered
    : selected
)

const getCollapsedSteps = createSelector(
  rootSelector,
  (state: RootState) => state.collapsedSteps
)

const getStepCreationButtonExpanded: Selector<boolean> = createSelector(
  rootSelector,
  (state: RootState) => state.stepCreationButtonExpanded
)

const getFormSectionCollapsed: Selector<FormSectionState> = createSelector(
  rootSelector,
  s => s.formSectionCollapse
)

const getSelectedStep = createSelector(
  steplistSelectors.getAllSteps,
  getSelectedStepId,
  (allSteps, selectedStepId) => {
    const stepId = selectedStepId

    if (!allSteps || stepId == null) {
      return null
    }

    return allSteps[stepId]
  }
)

export const getWellSelectionLabwareKey: Selector<?string> = createSelector(
  rootSelector,
  (state: RootState) => state.wellSelectionLabwareKey
)

const getFormModalData = createSelector(
  rootSelector,
  (state: RootState) => state.unsavedFormModal
)

export default {
  rootSelector,

  getSelectedStep,

  getStepCreationButtonExpanded,
  getSelectedStepId,
  getSelectedTerminalItemId,
  getHoveredTerminalItemId,
  getHoveredStepId,
  getActiveItem,
  getHoveredSubstep,
  getFormSectionCollapsed,
  getWellSelectionLabwareKey,
  getFormModalData,

  // NOTE: this is exposed only for substeps/selectors.js
  getCollapsedSteps,
}
