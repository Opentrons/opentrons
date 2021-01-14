// @flow
import { createSelector } from 'reselect'
import last from 'lodash/last'

import { selectors as stepFormSelectors } from '../../step-forms'
import {
  PRESAVED_STEP_ID,
  type SubstepIdentifier,
  type TerminalItemId,
} from '../../steplist/types'
import { getLabwareOnModule } from '../modules/utils'
import {
  initialSelectedItemState,
  type SelectableItem,
  type StepsState,
  type CollapsedStepsState,
  type HoverableItem,
  SINGLE_STEP_SELECTION_TYPE,
  TERMINAL_ITEM_SELECTION_TYPE,
  MULTI_STEP_SELECTION_TYPE,
} from './reducers'
import type { FormData, StepIdType, StepType } from '../../form-types'
import type { BaseState, Selector } from '../../types'

export const rootSelector = (state: BaseState): StepsState => state.ui.steps

// ======= Selectors ===============================================

// NOTE: when the selected step is deleted, we need to fall back to the last step
// (or the initial selected item, if there are no more saved steps).
// Ideally this would happen in the selectedItem reducer itself,
// but it's not easy to feed orderedStepIds into that reducer.
const getSelectedItem: Selector<SelectableItem> = createSelector(
  rootSelector,
  stepFormSelectors.getOrderedStepIds,
  (state, orderedStepIds) => {
    if (state.selectedItem != null) return state.selectedItem
    if (orderedStepIds.length > 0)
      return {
        selectionType: SINGLE_STEP_SELECTION_TYPE,
        id: last(orderedStepIds),
      }
    return initialSelectedItemState
  }
)

export const getSelectedStepId: Selector<StepIdType | null> = createSelector(
  getSelectedItem,
  item => (item.selectionType === SINGLE_STEP_SELECTION_TYPE ? item.id : null)
)

export const getSelectedTerminalItemId: Selector<TerminalItemId | null> = createSelector(
  getSelectedItem,
  item => (item.selectionType === TERMINAL_ITEM_SELECTION_TYPE ? item.id : null)
)

export const getMultiSelectItemIds: Selector<Array<StepIdType> | null> = createSelector(
  getSelectedItem,
  item => {
    if (item && item.selectionType === MULTI_STEP_SELECTION_TYPE) {
      return item.ids
    }
    return null
  }
)

export const getMultiSelectLastSelected: Selector<StepIdType | null> = createSelector(
  getSelectedItem,
  item => {
    if (item.selectionType === MULTI_STEP_SELECTION_TYPE) {
      return item.lastSelected
    }
    return null
  }
)

export const getHoveredItem: Selector<HoverableItem | null> = createSelector(
  rootSelector,
  (state: StepsState) => state.hoveredItem
)

export const getHoveredStepId: Selector<StepIdType | null> = createSelector(
  getHoveredItem,
  item =>
    item && item.selectionType === SINGLE_STEP_SELECTION_TYPE ? item.id : null
)

/** Array of labware (labwareId's) involved in hovered Step, or [] */
export const getHoveredStepLabware: Selector<Array<string>> = createSelector(
  stepFormSelectors.getArgsAndErrorsByStepId,
  getHoveredStepId,
  stepFormSelectors.getInitialDeckSetup,
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

export const getHoveredTerminalItemId: Selector<TerminalItemId | null> = createSelector(
  getHoveredItem,
  item =>
    item && item.selectionType === TERMINAL_ITEM_SELECTION_TYPE ? item.id : null
)

export const getHoveredSubstep: Selector<SubstepIdentifier> = createSelector(
  rootSelector,
  (state: StepsState) => state.hoveredSubstep
)

// Hovered or selected item. Hovered has priority. Used to tell deck what to display
export const getActiveItem: Selector<HoverableItem | null> = createSelector(
  getSelectedItem,
  getHoveredItem,
  (selected, hovered) => {
    if (hovered != null) {
      return hovered
    } else if (selected.selectionType === MULTI_STEP_SELECTION_TYPE) {
      return null
    } else {
      return selected
    }
  }
)

// TODO: BC 2018-12-17 refactor as react state
export const getCollapsedSteps: Selector<CollapsedStepsState> = createSelector(
  rootSelector,
  (state: StepsState) => state.collapsedSteps
)

type StepTitleInfo = {|
  stepName: string,
  stepType: StepType,
|}
const _stepToTitleInfo = (stepForm: FormData) => ({
  stepName: stepForm.stepName,
  stepType: stepForm.stepType,
})

export const getSelectedStepTitleInfo: Selector<StepTitleInfo | null> = createSelector(
  stepFormSelectors.getUnsavedForm,
  stepFormSelectors.getSavedStepForms,
  getSelectedStepId,
  getSelectedTerminalItemId,
  (unsavedForm, savedStepForms, selectedStepId, terminalItemId) => {
    if (unsavedForm != null && terminalItemId === PRESAVED_STEP_ID) {
      return _stepToTitleInfo(unsavedForm)
    }

    if (selectedStepId == null) {
      return null
    }

    return _stepToTitleInfo(savedStepForms[selectedStepId])
  }
)

export const getWellSelectionLabwareKey: Selector<
  string | null
> = createSelector(
  rootSelector,
  (state: StepsState) => state.wellSelectionLabwareKey
)

type MultiSelectFieldName =
  | 'aspirate_flowRate'
  | 'aspirate_mmFromBottom'
  | 'aspirate_wellOrder_first'
  | 'aspirate_wellOrder_second'
  | 'preWetTip'
  | 'aspirate_mix_checkbox'
  | 'aspirate_mix_volume'
  | 'aspirate_mix_times'
  | 'aspirate_delay_checkbox'
  | 'aspirate_delay_seconds'
  | 'aspirate_delay_mmFromBottom'
  | 'aspirate_airGap_checkbox'
  | 'aspirate_airGap_volume'
  | 'aspirate_touchTip_checkbox'
  | 'aspirate_touchTip_mmFromBottom'
  | 'dispense_flowRate'
  | 'dispense_mmFromBottom'
  | 'dispense_wellOrder_first'
  | 'dispense_wellOrder_second'
  | 'dispense_mix_checkbox'
  | 'dispense_mix_volume'
  | 'dispense_mix_times'
  | 'dispense_delay_checkbox'
  | 'dispense_delay_seconds'
  | 'dispense_delay_mmFromBottom'
  | 'dispense_airGap_checkbox'
  | 'dispense_airGap_volume'
  | 'dispense_touchTip_checkbox'
  | 'dispense_touchTip_mmFromBottom'
  | 'blowout_checkbox'
  | 'blowout_location'

type MultiselectFieldValues = {
  [fieldName: MultiSelectFieldName]: {|
    value?: any,
    isIndeterminate: boolean,
  |},
  ...,
}

const BATCH_EDIT_TRANSFER_FORM_FIELDS: Array<MultiSelectFieldName> = [
  'aspirate_flowRate',
  'aspirate_mmFromBottom',
  'aspirate_wellOrder_first',
  'aspirate_wellOrder_second',
  'preWetTip',
  'aspirate_mix_checkbox',
  'aspirate_mix_volume',
  'aspirate_mix_times',
  'aspirate_delay_checkbox',
  'aspirate_delay_seconds',
  'aspirate_delay_mmFromBottom',
  'aspirate_airGap_checkbox',
  'aspirate_airGap_volume',
  'aspirate_touchTip_checkbox',
  'aspirate_touchTip_mmFromBottom',

  'dispense_flowRate',
  'dispense_mmFromBottom',
  'dispense_wellOrder_first',
  'dispense_wellOrder_second',
  'dispense_mix_checkbox',
  'dispense_mix_volume',
  'dispense_mix_times',
  'dispense_delay_checkbox',
  'dispense_delay_seconds',
  'dispense_delay_mmFromBottom',
  'dispense_airGap_checkbox',
  'dispense_airGap_volume',
  'dispense_touchTip_checkbox',
  'dispense_touchTip_mmFromBottom',

  'blowout_checkbox',
  'blowout_location',
]

const dependentFieldCheckboxMap: {
  [MultiSelectFieldName]: MultiSelectFieldName,
} = {
  aspirate_mix_times: 'aspirate_mix_checkbox',
  aspirate_mix_volume: 'aspirate_mix_checkbox',
  aspirate_delay_seconds: 'aspirate_delay_checkbox',
  aspirate_delay_mmFromBottom: 'aspirate_delay_checkbox',
  aspirate_airGap_volume: 'aspirate_airGap_checkbox',
  aspirate_touchTip_mmFromBottom: 'aspirate_touchTip_checkbox',
  dispense_mix_times: 'dispense_mix_checkbox',
  dispense_mix_volume: 'dispense_mix_checkbox',
  dispense_delay_seconds: 'dispense_delay_checkbox',
  dispense_delay_mmFromBottom: 'dispense_delay_checkbox',
  dispense_airGap_volume: 'dispense_airGap_checkbox',
  dispense_touchTip_mmFromBottom: 'dispense_touchTip_checkbox',
  blowout_location: 'blowout_checkbox',
}

export const getMultiSelectFieldValues: Selector<MultiselectFieldValues | null> = createSelector(
  stepFormSelectors.getSavedStepForms,
  getMultiSelectItemIds,
  (savedStepForms, multiSelectItemIds) => {
    if (!multiSelectItemIds) return null
    const forms = multiSelectItemIds.map(id => savedStepForms[id])
    if (forms.some(form => form.stepType !== 'moveLiquid')) {
      return null
    }

    return BATCH_EDIT_TRANSFER_FORM_FIELDS.reduce(
      (acc: MultiselectFieldValues, fieldName: MultiSelectFieldName) => {
        const firstFieldValue = forms[0][fieldName]
        const dependentField = dependentFieldCheckboxMap[fieldName]
        const isFieldValueIndeterminant = forms.some(
          form =>
            form[fieldName] !== firstFieldValue ||
            (dependentField && form[dependentField] !== true)
        )

        if (isFieldValueIndeterminant) {
          acc[fieldName] = {
            isIndeterminate: true,
          }
          return acc
        } else {
          acc[fieldName] = {
            value: firstFieldValue,
            isIndeterminate: false,
          }
          return acc
        }
      },
      {}
    )
  }
)
