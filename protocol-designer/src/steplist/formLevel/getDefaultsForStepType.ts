import {
  DEFAULT_CHANGE_TIP_OPTION,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_WELL_ORDER_FIRST_OPTION,
  DEFAULT_WELL_ORDER_SECOND_OPTION,
  DEFAULT_DELAY_SECONDS,
  FIXED_TRASH_ID,
} from '../../constants'
import { StepType, StepFieldName } from '../../form-types'
export function getDefaultsForStepType(
  stepType: StepType
): Record<StepFieldName, any> {
  switch (stepType) {
    case 'mix':
      return {
        times: null,
        changeTip: DEFAULT_CHANGE_TIP_OPTION,
        labware: null,
        mix_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        mix_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        blowout_checkbox: false,
        blowout_location: FIXED_TRASH_ID,
        // NOTE(IL, 2021-03-12): mix uses dispense for both asp + disp, unless its falsey.
        // For now, unlike the other mmFromBottom fields, it's initializing to a constant instead of
        // using null to represent default (because null becomes 1mm asp, 0.5mm dispense -- see #7470.)
        mix_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_DISPENSE,
        pipette: null,
        volume: undefined,
        wells: [],
        aspirate_flowRate: null,
        dispense_flowRate: null,
        aspirate_delay_checkbox: false,
        aspirate_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        dispense_delay_checkbox: false,
        dispense_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        mix_touchTip_checkbox: false,
        mix_touchTip_mmFromBottom: null,
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
        aspirate_mmFromBottom: null,
        aspirate_touchTip_checkbox: false,
        aspirate_touchTip_mmFromBottom: null,
        dispense_flowRate: null,
        dispense_labware: null,
        dispense_wells: [],
        dispense_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        dispense_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        dispense_mix_checkbox: false,
        dispense_mix_times: null,
        dispense_mix_volume: null,
        dispense_mmFromBottom: null,
        dispense_touchTip_checkbox: false,
        dispense_touchTip_mmFromBottom: null,
        disposalVolume_checkbox: false,
        disposalVolume_volume: null,
        blowout_checkbox: false,
        blowout_location: FIXED_TRASH_ID,
        preWetTip: false,
        aspirate_airGap_checkbox: false,
        aspirate_airGap_volume: null,
        aspirate_delay_checkbox: false,
        aspirate_delay_mmFromBottom: null,
        aspirate_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        dispense_airGap_checkbox: false,
        dispense_airGap_volume: null,
        dispense_delay_checkbox: false,
        dispense_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        dispense_delay_mmFromBottom: null,
      }

    case 'moveLabware':
      return {
        labware: null,
        useGripper: false,
        newLocation: null,
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
    case 'heaterShaker':
      return {
        moduleId: null,
        setHeaterShakerTemperature: null,
        targetHeaterShakerTemperature: null,
        targetSpeed: null,
        setShake: null,
        latchOpen: false,
        heaterShakerSetTimer: null,
        heaterShakerTimerMinutes: null,
        heaterShakerTimerSeconds: null,
      }
    case 'thermocycler':
      return {
        thermocyclerFormType: null,
        moduleId: null,
        blockIsActive: false,
        blockTargetTemp: null,
        lidIsActive: false,
        lidTargetTemp: null,
        lidOpen: false,
        profileVolume: null,
        profileTargetLidTemp: null,
        orderedProfileItems: [],
        profileItemsById: {},
        blockIsActiveHold: false,
        blockTargetTempHold: null,
        lidIsActiveHold: false,
        lidTargetTempHold: null,
        lidOpenHold: null,
      }

    default:
      return {}
  }
}
