// @flow
import {
  DEFAULT_CHANGE_TIP_OPTION,
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_WELL_ORDER_FIRST_OPTION,
  DEFAULT_WELL_ORDER_SECOND_OPTION,
  FIXED_TRASH_ID,
} from '../../constants'
import type {StepType, StepFieldName} from '../../form-types'

// TODO: Ian 2019-01-17 move this somewhere more central - see #2926
export default function getDefaultsForStepType (stepType: StepType): {[StepFieldName]: any} {
  switch (stepType) {
    case 'transfer':
      return {
        'aspirate_changeTip': DEFAULT_CHANGE_TIP_OPTION,
        'aspirate_labware': null,
        'aspirate_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
        'aspirate_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION,
        'aspirate_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
        'aspirate_wells': [],
        'dispense_labware': null,
        'dispense_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
        'dispense_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION,
        'dispense_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_DISPENSE,
        'dispense_blowout_checkbox': false,
        'dispense_blowout_location': FIXED_TRASH_ID,
        'dispense_wells': [],
        'pipette': null,
        'volume': undefined,
      }
    case 'consolidate':
      return {
        'aspirate_changeTip': DEFAULT_CHANGE_TIP_OPTION,
        'aspirate_labware': null,
        'aspirate_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
        'aspirate_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
        'aspirate_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION,
        'aspirate_wells': [],
        'dispense_labware': null,
        'dispense_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_DISPENSE,
        'dispense_blowout_checkbox': false,
        'dispense_blowout_location': FIXED_TRASH_ID,
        'dispense_wells': [],
        'pipette': null,
        'volume': undefined,
      }
    case 'mix':
      return {
        'aspirate_changeTip': DEFAULT_CHANGE_TIP_OPTION,
        'labware': null,
        'aspirate_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
        'aspirate_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION,
        'blowout_checkbox': false,
        'blowout_location': FIXED_TRASH_ID,
        'mix_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_DISPENSE, // NOTE: mix uses dispense for both asp + disp, for now
        'pipette': null,
        'volume': undefined,
        'wells': [],
      }
    case 'distribute':
      return {
        'aspirate_changeTip': DEFAULT_CHANGE_TIP_OPTION,
        'aspirate_disposalVol_checkbox': true,
        'dispense_blowout_location': FIXED_TRASH_ID, // only blowout location for disposalVol
        'aspirate_labware': null,
        'aspirate_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
        'aspirate_wells': [],
        'dispense_labware': null,
        'dispense_wellOrder_first': DEFAULT_WELL_ORDER_FIRST_OPTION,
        'dispense_wellOrder_second': DEFAULT_WELL_ORDER_SECOND_OPTION,
        'dispense_mmFromBottom': DEFAULT_MM_FROM_BOTTOM_DISPENSE,
        'dispense_wells': [],
        'pipette': null,
        'volume': undefined,
      }
    case 'moveLiquid':
      return {
        pipette: null,
        volume: null,
        changeTip: DEFAULT_CHANGE_TIP_OPTION,
        path: 'single',
        aspirate_wells_grouped: false,

        aspirate_labware: null,
        aspirate_wells: [],
        aspirate_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        aspirate_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        aspirate_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
        aspirate_touchTip_checkbox: false,

        dispense_labware: null,
        dispense_wells: [],
        dispense_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        dispense_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        dispense_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_DISPENSE,
        dispense_touchTip_checkbox: false,

        blowout_checkbox: false,
        blowout_location: FIXED_TRASH_ID,
        preWetTip: false,
      }
    default:
      return {}
  }
}
