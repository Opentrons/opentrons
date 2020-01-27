// @flow
import { createSelector } from 'reselect'
import last from 'lodash/last'

import { selectors as stepFormSelectors } from '../../step-forms'
import { getLabwareOnModule } from '../modules/utils'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import type { StepIdType } from '../../form-types'
import type { BaseState, Selector } from '../../types'
import {
  initialSelectedItemState,
  type SelectableItem,
  type StepsState,
  type CollapsedStepsState,
} from './reducers'
import type {
  SubstepIdentifier,
  TerminalItemId,
  StepItemData,
} from '../../steplist/types'

const rootSelector = (state: BaseState): StepsState => state.ui.steps

// ======= Selectors ===============================================

/** fallbacks for selectedItem reducer, when null */
const getNonNullSelectedItem: Selector<SelectableItem> = createSelector(
  rootSelector,
  stepFormSelectors.getOrderedStepIds,
  (state, orderedStepIds) => {
    if (state.selectedItem != null) return state.selectedItem
    if (orderedStepIds.length > 0)
      return { isStep: true, id: last(orderedStepIds) }
    return initialSelectedItemState
  }
)

const getSelectedStepId: Selector<?StepIdType> = createSelector(
  getNonNullSelectedItem,
  item => (item.isStep ? item.id : null)
)

const getSelectedTerminalItemId: Selector<?TerminalItemId> = createSelector(
  getNonNullSelectedItem,
  item => (!item.isStep ? item.id : null)
)

const getHoveredItem: Selector<?SelectableItem> = createSelector(
  rootSelector,
  (state: StepsState) => state.hoveredItem
)

const getHoveredStepId: Selector<?StepIdType> = createSelector(
  getHoveredItem,
  item => (item && item.isStep ? item.id : null)
)

/** Array of labware (labwareId's) involved in hovered Step, or [] */
const getHoveredStepLabware: Selector<Array<string>> = createSelector(
  stepFormSelectors.getArgsAndErrorsByStepId,
  getHoveredStepId,
  getInitialDeckSetup,
  (allStepArgsAndErrors, hoveredStep, initialDeckState) => {
    const blank = []
    if (!hoveredStep || !allStepArgsAndErrors[hoveredStep]) {
      return blank
    }

    const stepArgs = allStepArgsAndErrors[hoveredStep].stepArgs

    if (!stepArgs) {
      return blank
    }

    if (
      stepArgs.commandCreatorFnName === 'consolidate' ||
      stepArgs.commandCreatorFnName === 'distribute' ||
      stepArgs.commandCreatorFnName === 'transfer'
    ) {
      // source and dest labware
      const src = stepArgs.sourceLabware
      const dest = stepArgs.destLabware

      return [src, dest]
    }

    if (stepArgs.commandCreatorFnName === 'mix') {
      // only 1 labware
      return [stepArgs.labware]
    }

    if (stepArgs.module) {
      const labware = getLabwareOnModule(initialDeckState, stepArgs.module)
      return labware ? [labware.id] : []
    }

    // step types that have no labware that gets highlighted
    if (!(stepArgs.commandCreatorFnName === 'delay')) {
      // TODO Ian 2018-05-08 use assert here
      console.warn(
        `getHoveredStepLabware does not support step type "${stepArgs.commandCreatorFnName}"`
      )
    }

    return blank
  }
)

const getHoveredTerminalItemId: Selector<?TerminalItemId> = createSelector(
  getHoveredItem,
  item => (item && !item.isStep ? item.id : null)
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
  (selected, hovered) => (hovered != null ? hovered : selected)
)

// TODO: BC 2018-12-17 refactor as react state
const getCollapsedSteps: Selector<CollapsedStepsState> = createSelector(
  rootSelector,
  (state: StepsState) => state.collapsedSteps
)

const getSelectedStep: Selector<StepItemData | null> = createSelector(
  stepFormSelectors.getAllSteps,
  getSelectedStepId,
  (allSteps, selectedStepId) => {
    const stepId = selectedStepId

    if (!allSteps || stepId == null) {
      return null
    }

    return allSteps[stepId]
  }
)

const getWellSelectionLabwareKey: Selector<?string> = createSelector(
  rootSelector,
  (state: StepsState) => state.wellSelectionLabwareKey
)

// TODO: Ian 2019-12-13 don't use default exports here
export default {
  rootSelector,

  getSelectedStep,

  getSelectedStepId,
  getSelectedTerminalItemId,
  getHoveredTerminalItemId,
  getHoveredStepId,
  getHoveredStepLabware,
  getActiveItem,
  getHoveredSubstep,
  getWellSelectionLabwareKey,

  // NOTE: this is exposed only for substeps/selectors.js
  getCollapsedSteps,
}
