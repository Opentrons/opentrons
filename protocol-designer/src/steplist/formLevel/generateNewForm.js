// @flow
import startCase from 'lodash/startCase'

import type {
  StepType,
  StepIdType,
  BlankForm,
} from '../../form-types'

import {
  DEFAULT_CHANGE_TIP_OPTION,
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_WELL_ORDER_FIRST_OPTION,
  DEFAULT_WELL_ORDER_SECOND_OPTION,
  FIXED_TRASH_ID,
} from '../../constants'

const generateNewForm = (stepId: StepIdType, stepType: StepType): BlankForm => {
  // Add default values to a new step form
  const baseForm = {
    id: stepId,
    stepType: stepType,
    'step-name': startCase(stepType),
    'step-details': '',
  }
  return {...baseForm, ...getDefaultsForStepType(stepType)}
}

export const getDefaultsForStepType = (stepType: StepType) => {
  switch (stepType) {
    case 'transfer':
      return {
        'aspirate_changeTip': DEFAULT_CHANGE_TIP_OPTION,
        'aspirate_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
        'aspirate_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION,
        'aspirate_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
        'dispense_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
        'dispense_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION,
        'dispense_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_DISPENSE,
      }
    case 'consolidate':
      return {
        'aspirate_changeTip': DEFAULT_CHANGE_TIP_OPTION,
        'aspirate_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
        'aspirate_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
        'aspirate_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION,
        'dispense_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_DISPENSE,
      }
    case 'mix':
      return {
        'aspirate_changeTip': DEFAULT_CHANGE_TIP_OPTION,
        'aspirate_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
        'aspirate_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION,
        'mmFromBottom': DEFAULT_MM_FROM_BOTTOM_DISPENSE, // NOTE: mix uses dispense for both asp + disp, for now
      }
    case 'distribute':
      return {
        'aspirate_changeTip': DEFAULT_CHANGE_TIP_OPTION,
        'aspirate_disposalVol_checkbox': true,
        'aspirate_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
        'dispense_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
        'dispense_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION,
        'dispense_blowout_checkbox': true,
        'dispense_blowout_labware': FIXED_TRASH_ID,
        'dispense_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_DISPENSE,
      }
    default:
      return {}
  }
}

export default generateNewForm
