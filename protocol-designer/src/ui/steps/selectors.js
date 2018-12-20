// @flow
import {createSelector} from 'reselect'
import last from 'lodash/last'
import isEmpty from 'lodash/isEmpty'

import steplistSelectors from '../../steplist/selectors'
import type {RootState as SteplistRootState} from '../../steplist/reducers'
import type {StepIdType} from '../../form-types'
import type {BaseState, Selector} from '../../types'
import {
  initialSelectedItemState,
  type SelectableItem,
  type StepsState,
} from './reducers'

import type {
  SubstepIdentifier,
  TerminalItemId,
} from '../../steplist/types'

const rootSelector = (state: BaseState): StepsState => state.ui.steps

// ======= Selectors ===============================================

/** fallbacks for selectedItem reducer, when null */
const getNonNullSelectedItem: Selector<SelectableItem> = createSelector(
  rootSelector,
  steplistSelectors.rootSelector,
  (state: StepsState, steplistState: SteplistRootState) => {
    if (state.selectedItem != null) return state.selectedItem
    if (steplistState.orderedSteps.length > 0) return {isStep: true, id: last(steplistState.orderedSteps)}
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
  (state: StepsState) => state.hoveredItem
)

const getHoveredStepId: Selector<?StepIdType> = createSelector(
  getHoveredItem,
  (item) => (item && item.isStep) ? item.id : null
)

/** Array of labware (labwareId's) involved in hovered Step, or [] */
const getHoveredStepLabware: Selector<Array<string>> = createSelector(
  steplistSelectors.getArgsAndErrorsByStepId,
  getHoveredStepId,
  (allStepArgsAndErrors, hoveredStep) => {
    const blank = []
    if (!hoveredStep || !allStepArgsAndErrors[hoveredStep]) {
      return blank
    }

    const stepForm = allStepArgsAndErrors[hoveredStep].stepArgs

    if (!stepForm) {
      return blank
    }

    if (
      stepForm.stepType === 'consolidate' ||
      stepForm.stepType === 'distribute' ||
      stepForm.stepType === 'transfer'
    ) {
      // source and dest labware
      const src = stepForm.sourceLabware
      const dest = stepForm.destLabware

      return [src, dest]
    }

    if (stepForm.stepType === 'mix') {
      // only 1 labware
      return [stepForm.labware]
    }

    // step types that have no labware that gets highlighted
    if (!(stepForm.stepType === 'pause')) {
      // TODO Ian 2018-05-08 use assert here
      console.warn(`getHoveredStepLabware does not support step type "${stepForm.stepType}"`)
    }

    return blank
  }
)

const getHoveredTerminalItemId: Selector<?TerminalItemId> = createSelector(
  getHoveredItem,
  (item) => (item && !item.isStep) ? item.id : null
)

const getHoveredSubstep: Selector<SubstepIdentifier> = createSelector(
  rootSelector,
  (state: StepsState) => state.hoveredSubstep
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

// TODO: BC 2018-12-17 refactor as react state
const getCollapsedSteps = createSelector(
  rootSelector,
  (state: StepsState) => state.collapsedSteps
)

// TODO: BC 2018-12-17 refactor as react state
const getStepCreationButtonExpanded: Selector<boolean> = createSelector(
  rootSelector,
  (state: StepsState) => state.stepCreationButtonExpanded
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

// TODO: BC: 2018-10-26 remove this when we decide to not block save
export const getCurrentFormCanBeSaved: Selector<boolean | null> = createSelector(
  steplistSelectors.getHydratedUnsavedForm,
  getSelectedStepId,
  steplistSelectors.getAllSteps,
  (hydratedForm, selectedStepId, allSteps) => {
    if (selectedStepId == null || !allSteps[selectedStepId] || !hydratedForm) return null
    return isEmpty(steplistSelectors.getAllErrorsFromHydratedForm(hydratedForm))
  }
)

const getWellSelectionLabwareKey: Selector<?string> = createSelector(
  rootSelector,
  (state: StepsState) => state.wellSelectionLabwareKey
)

const getFormModalData = createSelector(
  rootSelector,
  (state: StepsState) => state.unsavedFormModal
)

export default {
  rootSelector,

  getSelectedStep,

  getStepCreationButtonExpanded,
  getSelectedStepId,
  getSelectedTerminalItemId,
  getHoveredTerminalItemId,
  getHoveredStepId,
  getHoveredStepLabware,
  getActiveItem,
  getHoveredSubstep,
  getWellSelectionLabwareKey,
  getFormModalData,
  getCurrentFormCanBeSaved,

  // NOTE: this is exposed only for substeps/selectors.js
  getCollapsedSteps,
}
