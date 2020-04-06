// @flow
import {
  DEFAULT_CHANGE_TIP_OPTION,
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_WELL_ORDER_FIRST_OPTION,
  DEFAULT_WELL_ORDER_SECOND_OPTION,
  FIXED_TRASH_ID,
} from '../../constants'
import type { StepType, StepFieldName } from '../../form-types'

// TODO: Ian 2019-01-17 move this somewhere more central - see #2926
export function getDefaultsForStepType(
  stepType: StepType
): { [StepFieldName]: any } {
  switch (stepType) {
    case 'mix':
      return {
        changeTip: DEFAULT_CHANGE_TIP_OPTION,
        labware: null,
        mix_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        mix_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        blowout_checkbox: false,
        blowout_location: FIXED_TRASH_ID,
        mix_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_DISPENSE, // NOTE: mix uses dispense for both asp + disp, for now
        pipette: null,
        volume: undefined,
        wells: [],
      }
    case 'moveLiquid':
      return {
        pipette: null,
        volume: null,
        changeTip: DEFAULT_CHANGE_TIP_OPTION,
        path: 'single',
        aspirate_wells_grouped: false,

        aspirate_flowRate: null,
        aspirate_labware: null,
        aspirate_wells: [],
        aspirate_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        aspirate_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        aspirate_mix_checkbox: false,
        aspirate_mix_times: null,
        aspirate_mix_volume: null,
        aspirate_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
        aspirate_touchTip_checkbox: false,

        dispense_flowRate: null,
        dispense_labware: null,
        dispense_wells: [],
        dispense_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        dispense_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        dispense_mix_checkbox: false,
        dispense_mix_times: null,
        dispense_mix_volume: null,
        dispense_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_DISPENSE,
        dispense_touchTip_checkbox: false,

        disposalVolume_checkbox: false,
        disposalVolume_volume: null,

        blowout_checkbox: false,
        blowout_location: FIXED_TRASH_ID,
        preWetTip: false,
      }
    case 'pause':
      return {
        pauseAction: null,
        pauseHour: null,
        pauseMinute: null,
        pauseSecond: null,
        pauseMessage: '',
        moduleId: null,
        pauseTemperature: null,
      }
    case 'manualIntervention':
      return {
        labwareLocationUpdate: {},
        pipetteLocationUpdate: {},
        moduleLocationUpdate: {},
      }
    case 'magnet':
      return {
        moduleId: null,
        magnetAction: null,
        engageHeight: null,
      }
    case 'temperature':
      return {
        moduleId: null,
        setTemperature: null,
        targetTemperature: null,
      }
    default:
      return {}
  }
}
