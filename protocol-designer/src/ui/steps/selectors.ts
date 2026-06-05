import last from 'lodash/last'
import uniq from 'lodash/uniq'
import { createSelector } from 'reselect'

import { COMMAND_CREATOR_ARGS_FOR_OAI } from '@opentrons/shared-data'

import { selectors as stepFormSelectors } from '../../step-forms'
import { getDefaultsForStepType } from '../../steplist/formLevel/getDefaultsForStepType'
import { getLabwareOnModule } from '../modules/utils'
import {
  initialSelectedItemState,
  MULTI_STEP_SELECTION_TYPE,
  SINGLE_STEP_SELECTION_TYPE,
  TERMINAL_ITEM_SELECTION_TYPE,
} from './reducers'
import {
  getAspirateLabwareDisabledFields,
  getDispenseLabwareDisabledFields,
  getLabwareDisabledFields,
  getMultiAspiratePathDisabledFields,
  getMultiDispensePathDisabledFields,
  getPipetteDifferentAndMultiAspiratePathFields,
  getPipetteDifferentAndMultiDispensePathFields,
  getPipetteDifferentDisabledFields,
} from './utils'

import type {
  CountPerStepType,
  FormData,
  StepFieldName,
  StepIdType,
  StepType,
} from '../../form-types'
import type { SubstepIdentifier, TerminalItemId } from '../../steplist/types'
import type { BaseState, Selector } from '../../types'
import type { Selection } from './actions/types'
import type { HoverableItem, SelectableItem, StepsState } from './reducers'

export const rootSelector = (state: BaseState): StepsState => state.ui.steps

const getSelectedItem: Selector<SelectableItem> = createSelector(
  rootSelector,
  stepFormSelectors.getOrderedStepIds,
  (state, orderedStepIds) => {
    if (state.selectedItem != null) return state.selectedItem
    else {
      // NOTE: when the selected step is deleted, we need to fall back to the last step
      // (or the initial selected item, if there are no more saved steps).
      // Ideally this would happen in the selectedItem reducer itself,
      // but it's not easy to feed orderedStepIds into that reducer.
      if (orderedStepIds.length > 0) {
        return {
          selectionType: SINGLE_STEP_SELECTION_TYPE,
          // This non-null assertion is safe because the length is checked above.
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          id: last(orderedStepIds)!,
        }
      } else {
        return initialSelectedItemState
      }
    }
  }
)

export const getSelectedStepId: Selector<StepIdType | null> = createSelector(
  getSelectedItem,
  item => (item.selectionType === SINGLE_STEP_SELECTION_TYPE ? item.id : null)
)
export const getSelectedTerminalItemId: Selector<TerminalItemId | null> =
  createSelector(getSelectedItem, item =>
    item.selectionType === TERMINAL_ITEM_SELECTION_TYPE ? item.id : null
  )

export const getIsMultiSelectMode: Selector<boolean> = createSelector(
  getSelectedItem,
  item => {
    return item.selectionType === MULTI_STEP_SELECTION_TYPE
  }
)

export const getMultiSelectItemIds: Selector<StepIdType[] | null> =
  createSelector(getSelectedItem, item => {
    if (item && item.selectionType === MULTI_STEP_SELECTION_TYPE) {
      return item.ids
    }

    return null
  })

export const getMultiSelectLastSelected = createSelector(
  getSelectedItem,
  (item): StepIdType | null => {
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

export const getHoveredDropdownItem: Selector<Selection> = createSelector(
  rootSelector,
  (state: StepsState) => state.hoveredDropdownItem
)

export const getSelectedDropdownItem: Selector<Selection[]> = createSelector(
  rootSelector,
  (state: StepsState) => state.selectedDropdownItem
)

/** Array of labware (labwareId's) involved in hovered Step, or [] */
export const getHoveredStepLabware = createSelector(
  stepFormSelectors.getArgsAndErrorsByStepId,
  getHoveredStepId,
  stepFormSelectors.getInitialDeckSetup,
  (allStepArgsAndErrors, hoveredStep, initialDeckState) => {
    const blank: string[] = []

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
    if ('moduleId' in stepArgs) {
      const labware = getLabwareOnModule(
        initialDeckState,
        stepArgs.moduleId ?? ''
      )
      return labware ? [labware.id] : []
    }

    if (stepArgs.commandCreatorFnName === 'moveLabware') {
      const src = stepArgs.labwareId
      return [src]
    }

    // step types that have no labware that gets highlighted
    if (
      !(stepArgs.commandCreatorFnName === 'delay') &&
      !(stepArgs.commandCreatorFnName === 'comment') &&
      !(stepArgs.commandCreatorFnName === 'captureImage') &&
      !COMMAND_CREATOR_ARGS_FOR_OAI.includes(stepArgs.commandCreatorFnName)
    ) {
      console.warn(
        //  highlighted wells is not yet implemented
        `getHoveredStepLabware does not support step type "${stepArgs.commandCreatorFnName}"`
      )
    }

    return blank
  }
)

export const getHoveredTerminalItemId: Selector<TerminalItemId | null> =
  createSelector(getHoveredItem, item =>
    item && item.selectionType === TERMINAL_ITEM_SELECTION_TYPE ? item.id : null
  )

export const getHoveredSubstep: Selector<SubstepIdentifier> = createSelector(
  rootSelector,
  (state: StepsState) => state.hoveredSubstep
)

// Hovered or selected item. Hovered has priority. Used to tell deck what to display
export const getActiveItem = createSelector(
  getSelectedItem,
  getHoveredItem,
  (selected, hovered): HoverableItem | null => {
    if (hovered != null) {
      return hovered
    } else if (selected.selectionType === MULTI_STEP_SELECTION_TYPE) {
      return null
    } else {
      return selected
    }
  }
)

export const getWellSelectionLabwareKey: Selector<string | null> =
  createSelector(
    rootSelector,
    (state: StepsState) => state.wellSelectionLabwareKey
  )

export type MultiselectFieldValues = Record<
  StepFieldName,
  {
    value?: any
    isIndeterminate: boolean
  }
>

const getUniqueValues = (key: string, forms: FormData[]): string[] =>
  Array.from(new Set(forms.map(form => form[key])))

export const _getSavedMultiSelectFieldValues = createSelector(
  stepFormSelectors.getSavedStepForms,
  getMultiSelectItemIds,
  (savedStepForms, multiSelectItemIds): MultiselectFieldValues | null => {
    if (!multiSelectItemIds) return null
    const forms = multiSelectItemIds.map(id => savedStepForms[id])
    const stepTypes = uniq(forms.map(form => form.stepType))

    if (stepTypes.length !== 1) {
      return null
    }

    const stepType: StepType = stepTypes[0]

    if (stepType !== 'moveLiquid' && stepType !== 'mix') {
      return null
    }

    const uniqueTipRackFieldValues = getUniqueValues('tipRack', forms)
    const uniquePipetteFieldValues = getUniqueValues('pipette', forms)

    //  since a lot liquid class advanced settings rely on
    //  knowing the pipette and tiprack, we can't support
    //  batch edit if the steps have multiple tiprack types
    //  or multiple pipette types
    if (
      uniqueTipRackFieldValues.length > 1 ||
      uniquePipetteFieldValues.length > 1
    ) {
      return null
    }

    const allFieldNames = Object.keys(getDefaultsForStepType(stepType))
    return allFieldNames.reduce(
      (acc: MultiselectFieldValues, fieldName: StepFieldName) => {
        const firstFieldValue = forms[0][fieldName]
        const isFieldValueIndeterminant = forms.some(
          form => form[fieldName] !== firstFieldValue
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

export const getMultiSelectFieldValues = createSelector(
  _getSavedMultiSelectFieldValues,
  stepFormSelectors.getBatchEditFieldChanges,
  (savedValues, changes): MultiselectFieldValues | null => {
    if (savedValues === null) {
      // multi-selection has an invalid combination of stepTypes
      return null
    }

    const multiselectChanges = Object.keys(
      changes
    ).reduce<MultiselectFieldValues>((acc, name) => {
      acc[name] = {
        value: changes[name],
        isIndeterminate: false,
      }
      return acc
    }, {})
    return { ...savedValues, ...multiselectChanges }
  }
)

// NOTE: the value is the tooltip text explaining why the field is disabled
type TooltipText = string

export type DisabledFields = Record<string, TooltipText>

export const getMultiSelectDisabledFields = createSelector(
  stepFormSelectors.getSavedStepForms,
  getMultiSelectItemIds,
  (savedStepForms, multiSelectItemIds): DisabledFields | null => {
    if (!multiSelectItemIds) return null
    const forms: FormData[] = multiSelectItemIds.map(id => savedStepForms[id])

    if (forms.every(form => form.stepType === 'moveLiquid')) {
      return getMoveLiquidMultiSelectDisabledFields(forms)
    } else if (forms.every(form => form.stepType === 'mix')) {
      return getMixMultiSelectDisabledFields(forms)
    } else {
      return null
    }
  }
)

export const getCountPerStepType = createSelector(
  getMultiSelectItemIds,
  stepFormSelectors.getSavedStepForms,
  (stepIds, allSteps): CountPerStepType => {
    if (stepIds === null) return {}
    const steps = stepIds.map(id => allSteps[id])
    const countPerStepType = steps.reduce<CountPerStepType>((acc, step) => {
      const { stepType } = step
      // @ts-expect-error(sa, 2021-6-15): cannot type narrow this way in TS
      const newCount = acc[stepType] ? acc[stepType] + 1 : 1
      acc[stepType] = newCount
      return acc
    }, {})
    return countPerStepType
  }
)

export const getBatchEditSelectedStepTypes = createSelector(
  getCountPerStepType,
  (countPerStepType): StepType[] => {
    return uniq(
      (Object.keys(countPerStepType) as StepType[]).filter(
        // @ts-expect-error(sa, 2021-6-15): TS thinks countPerStepType[stepType] might be undefined because CountPerStepType is a partial record
        stepType => countPerStepType[stepType] > 0
      )
    ).sort()
  }
)

function getMoveLiquidMultiSelectDisabledFields(
  forms: FormData[]
): DisabledFields {
  const {
    pipettesDifferent,
    aspirateLabwareDifferent,
    dispenseLabwareDifferent,
    includesMultiAspirate,
    includesMultiDispense,
  } = forms.reduce(
    (acc, form) => ({
      lastPipette: form.pipette,
      lastAspirateLabware: form.aspirate_labware,
      lastDispenseLabware: form.dispense_labware,
      pipettesDifferent:
        form.pipette !== acc.lastPipette || acc.pipettesDifferent,
      aspirateLabwareDifferent:
        form.aspirate_labware !== acc.lastAspirateLabware ||
        acc.aspirateLabwareDifferent,
      dispenseLabwareDifferent:
        form.dispense_labware !== acc.lastDispenseLabware ||
        acc.dispenseLabwareDifferent,
      includesMultiAspirate:
        form.path === 'multiAspirate' || acc.includesMultiAspirate,
      includesMultiDispense:
        form.path === 'multiDispense' || acc.includesMultiDispense,
    }),
    {
      lastPipette: forms[0].pipette,
      lastAspirateLabware: forms[0].aspirate_labware,
      lastDispenseLabware: forms[0].dispense_labware,
      pipettesDifferent: false,
      aspirateLabwareDifferent: false,
      dispenseLabwareDifferent: false,
      includesMultiAspirate: false,
      includesMultiDispense: false,
    }
  )
  const disabledFields: DisabledFields = {
    ...(pipettesDifferent && getPipetteDifferentDisabledFields('moveLiquid')),
    ...(aspirateLabwareDifferent && getAspirateLabwareDisabledFields()),
    ...(dispenseLabwareDifferent && getDispenseLabwareDisabledFields()),
    ...(includesMultiAspirate && getMultiAspiratePathDisabledFields()),
    ...(includesMultiDispense && getMultiDispensePathDisabledFields()),
    ...(includesMultiAspirate &&
      pipettesDifferent &&
      getPipetteDifferentAndMultiAspiratePathFields()),
    ...(includesMultiDispense &&
      pipettesDifferent &&
      getPipetteDifferentAndMultiDispensePathFields()),
  }
  return disabledFields
}

function getMixMultiSelectDisabledFields(forms: FormData[]): DisabledFields {
  const { pipettesDifferent, labwareDifferent } = forms.reduce(
    (acc, form) => ({
      lastPipette: form.pipette,
      lastLabware: form.labware,
      pipettesDifferent:
        form.pipette !== acc.lastPipette || acc.pipettesDifferent,
      labwareDifferent:
        form.labware !== acc.lastLabware || acc.labwareDifferent,
    }),
    {
      lastPipette: forms[0].pipette,
      lastLabware: forms[0].labware,
      pipettesDifferent: false,
      labwareDifferent: false,
    }
  )
  const disabledFields: DisabledFields = {
    ...(pipettesDifferent && getPipetteDifferentDisabledFields('mix')),
    ...(labwareDifferent && getLabwareDisabledFields()),
  }
  return disabledFields
}

export const getSelectedSubstep: Selector<StepIdType | null> = createSelector(
  rootSelector,
  (state: StepsState) => state.selectedSubstep
)
