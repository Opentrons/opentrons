import { A1_NOZZLE, ALL } from '@opentrons/shared-data'
import { AUTOMATIC } from '@opentrons/step-generation'

import {
  ABSORBANCE_READER_COLOR_BY_WAVELENGTH,
  DEFAULT_CHANGE_TIP_OPTION,
  DEFAULT_DELAY_SECONDS,
  DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP,
  DEFAULT_MM_OFFSET_FROM_BOTTOM,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_EDGE,
  DEFAULT_TOUCH_TIP_SPEED,
  DEFAULT_WELL_ORDER_FIRST_OPTION,
  DEFAULT_WELL_ORDER_SECOND_OPTION,
} from '../../constants'

import type { StepFieldName, StepType } from '../../form-types'

export function getDefaultsForStepType(
  stepType: StepType
): Record<StepFieldName, any> {
  switch (stepType) {
    case 'mix':
      return {
        // For now, unlike the other mmFromBottom fields, it's initializing to a constant instead of
        // NOTE(IL, 2021-03-12): mix uses dispense for both asp + disp, unless its falsey.
        // using null to represent default (because null becomes 1mm asp, 0.5mm dispense -- see #7470.)
        aspirate_delay_checkbox: false,
        aspirate_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        aspirate_flowRate: null,
        blowout_checkbox: false,
        blowout_flowRate: null,
        blowout_location: null,
        blowout_z_offset: DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP,
        changeTip: DEFAULT_CHANGE_TIP_OPTION,
        dispense_delay_checkbox: false,
        dispense_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        dispense_flowRate: null,
        dropTip_location: null,
        dropTip_wellNames: undefined,
        labware: null,
        liquidClassesSupported: true,
        liquidClass: 'none',
        mix_mmFromBottom: DEFAULT_MM_OFFSET_FROM_BOTTOM,
        mix_touchTip_checkbox: false,
        mix_touchTip_mmFromTop: null,
        mix_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        mix_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        mix_position_reference: 'well-bottom',
        mix_x_position: 0,
        mix_y_position: 0,
        nozzles: null,
        pickUpTip_location: undefined,
        pickUpTip_wellNames: undefined,
        pipette: null,
        primaryNozzle: A1_NOZZLE,
        pushOut_checkbox: null,
        pushOut_volume: null,
        times: null,
        tipRack: null,
        tip_tracking: AUTOMATIC,
        tiprack_selected: null,
        tips_selected: [],
        volume: undefined,
        wells: [],
      }

    case 'moveLiquid':
      return {
        aspirate_airGap_checkbox: false,
        aspirate_airGap_volume: null,
        aspirate_delay_checkbox: false,
        aspirate_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        aspirate_flowRate: null,
        aspirate_labware: null,
        aspirate_mix_checkbox: false,
        aspirate_mix_times: null,
        aspirate_mix_volume: null,
        aspirate_mmFromBottom: null,
        aspirate_position_reference: 'well-bottom',
        aspirate_retract_delay_seconds: 0,
        aspirate_retract_mmFromBottom: null,
        aspirate_retract_speed: null,
        aspirate_retract_x_position: 0,
        aspirate_retract_y_position: 0,
        aspirate_retract_position_reference: 'well-top',
        aspirate_submerge_delay_seconds: 0,
        aspirate_submerge_speed: null,
        aspirate_submerge_mmFromBottom: null,
        aspirate_submerge_x_position: 0,
        aspirate_submerge_y_position: 0,
        aspirate_submerge_position_reference: 'well-top',
        aspirate_touchTip_checkbox: false,
        aspirate_touchTip_mmFromTop: null,
        aspirate_touchTip_speed: DEFAULT_TOUCH_TIP_SPEED,
        aspirate_touchTip_mmFromEdge: DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_EDGE,
        aspirate_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        aspirate_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        aspirate_wells_grouped: false,
        aspirate_wells: [],
        aspirate_x_position: 0,
        aspirate_y_position: 0,
        blowout_checkbox: false,
        blowout_flowRate: null,
        blowout_location: null,
        blowout_mmFromBottom: null,
        blowout_x_position: null,
        blowout_y_position: null,
        blowout_position_reference: 'well-top',
        changeTip: DEFAULT_CHANGE_TIP_OPTION,
        conditioning_checkbox: false,
        conditioning_volume: null,
        dispense_airGap_checkbox: false,
        dispense_airGap_volume: null,
        dispense_delay_checkbox: false,
        dispense_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        dispense_flowRate: null,
        dispense_labware: null,
        dispense_mix_checkbox: false,
        dispense_mix_times: null,
        dispense_mix_volume: null,
        dispense_mmFromBottom: null,
        dispense_position_reference: 'well-bottom',
        dispense_retract_delay_seconds: 0,
        dispense_retract_mmFromBottom: null,
        dispense_retract_speed: null,
        dispense_retract_x_position: 0,
        dispense_retract_y_position: 0,
        dispense_retract_position_reference: 'well-top',
        dispense_submerge_delay_seconds: 0,
        dispense_submerge_speed: null,
        dispense_submerge_mmFromBottom: null,
        dispense_submerge_x_position: 0,
        dispense_submerge_y_position: 0,
        dispense_submerge_position_reference: 'well-top',
        dispense_touchTip_checkbox: false,
        dispense_touchTip_mmFromTop: null,
        dispense_touchTip_speed: DEFAULT_TOUCH_TIP_SPEED,
        dispense_touchTip_mmFromEdge: DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_EDGE,
        dispense_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        dispense_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        dispense_wells: [],
        dispense_x_position: 0,
        dispense_y_position: 0,
        disposalVolume_checkbox: false,
        disposalVolume_volume: null,
        dropTip_location: null,
        dropTip_wellNames: undefined,
        liquidClassesSupported: true,
        liquidClass: 'none',
        nozzles: ALL,
        path: 'single',
        pickUpTip_location: undefined,
        pickUpTip_wellNames: undefined,
        pipette: null,
        preWetTip: false,
        primaryNozzle: null,
        pushOut_checkbox: null,
        pushOut_volume: null,
        tipRack: null,
        tip_tracking: AUTOMATIC,
        tiprack_selected: null,
        tips_selected: [],
        volume: null,
      }

    case 'camera':
      return {
        home_before: false,
        filename: null,
        resolution: null,
        zoom: null,
        contrast: null,
        brightness: null,
        saturation: null,
      }
    case 'comment':
      return {
        message: null,
      }
    case 'moveLabware':
      return {
        labware: null,
        newLocation: null,
        useGripper: false,
      }

    case 'pause':
      return {
        moduleId: null,
        pauseAction: null,
        pauseMessage: '',
        pauseTemperature: null,
        pauseTime: null,
      }

    case 'manualIntervention':
      return {
        labwareLocationUpdate: {},
        moduleLocationUpdate: {},
        pipetteLocationUpdate: {},
        moduleStateUpdate: {},
        trashBinLocationUpdate: {},
        wasteChuteLocationUpdate: {},
        stagingAreaLocationUpdate: {},
        gripperLocationUpdate: {},
      }

    case 'magnet':
      return {
        engageHeight: null,
        magnetAction: null,
        moduleId: null,
      }

    case 'temperature':
      return {
        moduleId: null,
        setTemperature: null,
        targetTemperature: null,
      }
    case 'heaterShaker':
      return {
        heaterShakerSetTimer: null,
        heaterShakerTimer: null,
        latchOpen: false,
        moduleId: null,
        setHeaterShakerTemperature: null,
        setShake: null,
        targetHeaterShakerTemperature: null,
        targetSpeed: null,
      }
    case 'thermocycler':
      return {
        blockIsActive: false,
        blockTargetTemp: null,
        lidIsActive: false,
        lidOpen: false,
        lidTargetTemp: null,
        moduleId: null,
        orderedProfileItems: [],
        profileItemsById: {},
        profileTargetLidTemp: null,
        profileVolume: null,
        thermocyclerFormType: 'thermocyclerState',
      }
    case 'absorbanceReader':
      return {
        absorbanceReaderFormType: null,
        fileName: null,
        lidOpen: null,
        mode: 'single',
        moduleId: null,
        referenceWavelength: null,
        referenceWavelengthActive: false,
        wavelengths: [Object.keys(ABSORBANCE_READER_COLOR_BY_WAVELENGTH)[0]], // default to first known wavelength
      }
    case 'flexStacker':
      return {
        fillLabwareUri: null,
        fillLabwareIds: null,
        flexStackerFormType: null,
        interventionMessage: null,
        moduleId: null,
      }
    case 'vacuum':
      return {
        moduleId: null,
        programType: null, // state | profile
        stateType: null, // vent | pump
        modeType: null, // pressure | power
        pressureMbar: null,
        percentPower: null,
        pumpDurationCheckbox: null,
        pumpDurationTime: null,
        endingHoldVentCheckbox: null,
        vacuumOrderedProfileIds: [],
        vacuumProfileItemsById: {},
      }
    default:
      return {}
  }
}
