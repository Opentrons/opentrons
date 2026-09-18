import {
  getMaxPushOutVolume,
  getMinXYDimension,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  VACUUM_MAX_PRESSURE_MBAR,
  VACUUM_MIN_PRESSURE_MBAR,
} from '@opentrons/shared-data'
import {
  MANUAL,
  VACUUM_MODE_PRESSURE,
  VACUUM_PROGRAM_PROFILE,
  VACUUM_PROGRAM_STATE,
  VACUUM_STATE_PUMP_ON,
} from '@opentrons/step-generation'

import {
  ABSORBANCE_READER_INITIALIZE,
  ABSORBANCE_READER_MAX_WAVELENGTH_NM,
  ABSORBANCE_READER_MIN_WAVELENGTH_NM,
  ABSORBANCE_READER_READ,
  MAX_ENGAGE_HEIGHT_V1,
  MAX_ENGAGE_HEIGHT_V2,
  MAX_HEATER_SHAKER_MODULE_RPM,
  MAX_HEATER_SHAKER_MODULE_TEMP,
  MAX_TC_BLOCK_TEMP,
  MAX_TC_LID_TEMP,
  MAX_TC_PROFILE_VOLUME,
  MAX_TEMP_MODULE_TEMP,
  MIN_ENGAGE_HEIGHT_V1,
  MIN_ENGAGE_HEIGHT_V2,
  MIN_HEATER_SHAKER_MODULE_RPM,
  MIN_HEATER_SHAKER_MODULE_TEMP,
  MIN_TC_BLOCK_TEMP,
  MIN_TC_LID_TEMP,
  MIN_TC_PROFILE_VOLUME,
  MIN_TEMP_MODULE_TEMP,
  PAUSE_UNTIL_RESUME,
  PAUSE_UNTIL_TC_PROFILE_COMPLETE,
  PAUSE_UNTIL_TEMP,
  PAUSE_UNTIL_TIME,
  PAUSE_UNTIL_VACUUM_PROFILE_COMPLETE,
  PAUSE_UNTIL_VACUUM_STATE_COMPLETE,
  THERMOCYCLER_PROFILE,
} from '../../constants'
import { getPipetteCapacity } from '../../pipettes/pipetteData'
import { canPipetteUseLabware, getMaxConditioningVolume } from '../../utils'
import { getTimeFromForm } from '../utils/getTimeFromForm'
import { getWellRatio } from '../utils/getWellRatio'

import type { ReactNode } from 'react'
import type { LabwareDefinition2, PipetteV2Specs } from '@opentrons/shared-data'
import type { LabwareEntities, PipetteEntity } from '@opentrons/step-generation'
import type {
  HydratedAbsorbanceReaderFormData,
  HydratedCommentFormData,
  HydratedFlexStackerFormData,
  HydratedFormData,
  HydratedHeaterShakerFormData,
  HydratedMagnetFormData,
  HydratedMixFormData,
  HydratedMoveLabwareFormData,
  HydratedMoveLiquidFormData,
  HydratedPauseFormData,
  HydratedTemperatureFormData,
  HydratedThermocyclerFormData,
  HydratedVacuumFormData,
  LabwareOrAdditionalEquipmentEntity,
  StepFieldName,
} from '../../form-types'
import type { LiquidHandlingTab } from '../../pages/Designer/ProtocolSteps/StepForm/types'
import type { ModuleEntities } from '../../step-forms'

const MIN_TRANSFER_VOLUME = 0.1

/*******************
 ** Error Messages **
 ********************/

export type FormErrorLocationType = 'field' | 'form'
export interface FormError {
  title: string
  dependentFields: StepFieldName[]
  //  location the error appears in the form
  location: FormErrorLocationType[]
  //  used for top-level form warnings see formLevel/warnings.tsx
  body?: ReactNode
  //  for multi-step forms; 0-indexed
  page?: number
  //  for mix and moveLiquid tools
  tab?: LiquidHandlingTab
  showOnReopen?: boolean
}

const RANGE_TITLE = 'Enter a value within the specified range'
const TIME_TITLE = 'Enter a value that uses the specified format'

const INCOMPATIBLE_ASPIRATE_LABWARE: FormError = {
  title: 'Selected aspirate labware is incompatible with pipette',
  dependentFields: ['aspirate_labware', 'pipette'],
  location: ['form'],
  showOnReopen: true,
}
const INCOMPATIBLE_DISPENSE_LABWARE: FormError = {
  title: 'Selected dispense labware is incompatible with pipette',
  dependentFields: ['dispense_labware', 'pipette'],
  location: ['form'],
  showOnReopen: true,
}
const INCOMPATIBLE_LABWARE: FormError = {
  title: 'Selected labware is incompatible with pipette',
  dependentFields: ['labware', 'pipette'],
  location: ['form'],
  showOnReopen: true,
}
const PAUSE_TYPE_REQUIRED: FormError = {
  title:
    'Must either pause for amount of time, until told to resume, or until temperature reached',
  dependentFields: ['pauseAction'],
  location: ['form'],
}
const TIME_PARAM_REQUIRED: FormError = {
  title: 'Must include hours, minutes, or seconds',
  dependentFields: ['pauseAction', 'pauseTime'],
  location: ['form'],
}
const PAUSE_TEMP_PARAM_REQUIRED: FormError = {
  title: 'Temperature is required',
  dependentFields: ['pauseAction', 'pauseTemperature'],
  location: ['form'],
}

const VOLUME_TOO_HIGH = (pipetteCapacity: number): FormError => ({
  title: `Volume is greater than maximum pipette/tip volume (${pipetteCapacity} ul)`,
  dependentFields: ['pipette', 'volume'],
  location: ['form'],
  showOnReopen: true,
})

const WELL_RATIO_MOVE_LIQUID: FormError = {
  title: 'Well selection must be 1 to many, many to 1, or N to N',
  dependentFields: ['aspirate_wells', 'dispense_wells'],
  location: ['form'],
  showOnReopen: true,
}
const WELL_RATIO_MOVE_LIQUID_INTO_WASTE_CHUTE: FormError = {
  title: 'Well selection must be many to 1, or 1 to 1',
  dependentFields: ['aspirate_wells'],
  location: ['form'],
  showOnReopen: true,
}
const MAGNET_ACTION_TYPE_REQUIRED: FormError = {
  title: 'Action type must be either engage or disengage',
  dependentFields: ['magnetAction'],
  location: ['form'],
}
const ENGAGE_HEIGHT_REQUIRED: FormError = {
  title: 'Engage height required',
  dependentFields: ['magnetAction', 'engageHeight'],
  location: ['field'],
}
const ENGAGE_HEIGHT_MIN_EXCEEDED: FormError = {
  title: 'Specified distance is below module minimum',
  dependentFields: ['magnetAction', 'engageHeight'],
  location: ['field'],
}
const ENGAGE_HEIGHT_MAX_EXCEEDED: FormError = {
  title: 'Specified distance is above module maximum',
  dependentFields: ['magnetAction', 'engageHeight'],
  location: ['field'],
}
const MODULE_ID_REQUIRED: FormError = {
  title:
    'Module is required. Ensure the appropriate module is present on the deck and selected for this step',
  dependentFields: ['moduleId'],
  location: ['field'],
  showOnReopen: true,
}
const TARGET_TEMPERATURE_REQUIRED: FormError = {
  title: 'Temperature required',
  dependentFields: ['setTemperature', 'targetTemperature'],
  location: ['field'],
}
const PROFILE_VOLUME_REQUIRED: FormError = {
  title: 'Well volume required',
  dependentFields: ['thermocyclerFormType', 'profileVolume'],
  location: ['field'],
  page: 1,
}
const PROFILE_LID_TEMPERATURE_REQUIRED: FormError = {
  title: RANGE_TITLE,
  dependentFields: ['thermocyclerFormType', 'profileTargetLidTemp'],
  location: ['field'],
  page: 1,
}
const LID_TEMPERATURE_REQUIRED: FormError = {
  title: RANGE_TITLE,
  dependentFields: ['lidIsActive', 'lidTargetTemp'],
  location: ['field'],
  page: 1,
}
const BLOCK_TEMPERATURE_REQUIRED: FormError = {
  title: RANGE_TITLE,
  dependentFields: ['blockIsActive', 'blockTargetTemp'],
  location: ['field'],
  page: 1,
}
const SHAKE_SPEED_REQUIRED: FormError = {
  title: RANGE_TITLE,
  dependentFields: ['setShake', 'targetSpeed'],
  location: ['field'],
}
const SHAKE_TIME_REQUIRED: FormError = {
  title: TIME_TITLE,
  dependentFields: ['heaterShakerSetTimer', 'heaterShakerTimer'],
  location: ['field'],
}
const SHAKER_TIME_FORMAT: FormError = {
  title: 'Must be a valid time (hh:mm:ss)',
  dependentFields: ['heaterShakerTimer'],
  location: ['field'],
}

const PAUSE_ACTION_REQUIRED: FormError = {
  title: 'Pause type required',
  dependentFields: [],
  location: ['field'],
}
const PAUSE_MODULE_REQUIRED: FormError = {
  title: 'Select a module',
  dependentFields: ['moduleId', 'pauseAction'],
  location: ['field'],
  showOnReopen: true,
}
const PAUSE_TEMP_REQUIRED: FormError = {
  title: 'Pause temperature required',
  dependentFields: ['pauseTemperature', 'pauseAction'],
  location: ['field'],
}
const HS_TEMPERATURE_REQUIRED: FormError = {
  title: RANGE_TITLE,
  dependentFields: [
    'targetHeaterShakerTemperature',
    'setHeaterShakerTemperature',
  ],
  location: ['field'],
}
const LABWARE_TO_MOVE_REQUIRED: FormError = {
  title: 'Labware required',
  dependentFields: ['labware'],
  location: ['field'],
  showOnReopen: true,
}
const NEW_LABWARE_LOCATION_REQUIRED: FormError = {
  title: 'New location required',
  dependentFields: ['newLocation'],
  location: ['field'],
  showOnReopen: true,
}
const ASPIRATE_WELLS_REQUIRED: FormError = {
  title: 'Choose wells',
  dependentFields: ['aspirate_wells'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const DISPENSE_WELLS_REQUIRED: FormError = {
  title: 'Choose wells',
  dependentFields: ['dispense_wells'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const MIX_WELLS_REQUIRED: FormError = {
  title: 'Choose wells',
  dependentFields: ['wells'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const VOLUME_REQUIRED: FormError = {
  title: 'Volume required',
  dependentFields: ['volume'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const TIMES_REQUIRED: FormError = {
  title: 'Enter an integer value greater than 0',
  dependentFields: ['times'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const ASPIRATE_LABWARE_REQUIRED: FormError = {
  title: 'Labware required',
  dependentFields: ['aspirate_labware'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const DISPENSE_LABWARE_REQUIRED: FormError = {
  title: 'Labware required',
  dependentFields: ['dispense_labware'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const MIX_LABWARE_REQUIRED: FormError = {
  title: 'Labware required',
  dependentFields: ['labware'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const ASPIRATE_MIX_TIMES_REQUIRED: FormError = {
  title: 'Enter an integer value greater than 0',
  dependentFields: ['aspirate_mix_times'],
  location: ['field'],
  page: 2,
  tab: 'aspirate',
}
const ASPIRATE_MIX_VOLUME_REQUIRED: FormError = {
  title: 'Volume required',
  dependentFields: ['aspirate_mix_checkbox', 'aspirate_mix_volume'],
  location: ['field'],
  page: 2,
  tab: 'aspirate',
}
const ASPIRATE_DELAY_DURATION_REQUIRED: FormError = {
  title: 'Duration required',
  dependentFields: ['aspirate_delay_checkbox', 'aspirate_delay_seconds'],
  location: ['field'],
  page: 2,
  tab: 'aspirate',
}
const ASPIRATE_AIRGAP_VOLUME_REQUIRED: FormError = {
  title: 'Volume required',
  dependentFields: ['aspirate_airGap_checkbox', 'aspirate_airGap_volume'],
  location: ['field'],
  page: 2,
  tab: 'aspirate',
}
const DISPENSE_MIX_TIMES_REQUIRED: FormError = {
  title: 'Enter an integer value greater than 0',
  dependentFields: ['dispense_mix_checkbox', 'dispense_mix_times'],
  location: ['field'],
  page: 2,
  tab: 'dispense',
}
const DISPENSE_MIX_VOLUME_REQUIRED: FormError = {
  title: 'Volume required',
  dependentFields: ['dispense_mix_checkbox', 'dispense_mix_volume'],
  location: ['field'],
  page: 2,
  tab: 'dispense',
}
const DISPENSE_DELAY_DURATION_REQUIRED: FormError = {
  title: 'Duration required',
  dependentFields: ['dispense_delay_checkbox', 'dispense_delay_seconds'],
  location: ['field'],
  page: 2,
  tab: 'dispense',
}
const DISPENSE_AIRGAP_VOLUME_REQUIRED: FormError = {
  title: 'Volume required',
  dependentFields: ['dispense_airGap_checkbox', 'dispense_airGap_volume'],
  location: ['field'],
  page: 2,
  tab: 'dispense',
}
const BLOWOUT_LOCATION_REQUIRED: FormError = {
  title: 'Blowout location required',
  dependentFields: ['blowout_checkbox', 'blowout_location'],
  location: ['field'],
  page: 2,
  tab: 'dispense',
}
const BLOWOUT_FLOW_RATE_REQUIRED: FormError = {
  title: 'Flow rate required',
  dependentFields: ['blowout_flowRate'],
  location: ['field'],
  page: 2,
  tab: 'dispense',
}
const WAVELENGTH_REQUIRED: FormError = {
  title: 'Custom wavelength required',
  dependentFields: ['wavelengths'],
  location: ['field'],
  page: 1,
}
const WAVELENGTH_OUT_OF_RANGE: FormError = {
  title: 'Value falls outside of accepted range',
  dependentFields: ['wavelengths'],
  location: ['field'],
  page: 1,
}
const REFERENCE_WAVELENGTH_OUT_OF_RANGE: FormError = {
  title: 'Value falls outside of accepted range',
  dependentFields: ['referenceWavelength'],
  location: ['field'],
  page: 1,
}
const REFERENCE_WAVELENGTH_REQUIRED: FormError = {
  title: 'Custom wavelength required',
  dependentFields: ['referenceWavelength'],
  location: ['field'],
  page: 1,
}
const FILENAME_REQUIRED: FormError = {
  title: 'File name required',
  dependentFields: ['fileName'],
  location: ['field'],
  page: 1,
}
const ABSORBANCE_READER_MODULE_ID_REQUIRED: FormError = {
  title: 'Module required',
  dependentFields: ['moduleId'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const MAGNETIC_MODULE_ID_REQUIRED: FormError = {
  title: 'Module required',
  dependentFields: ['moduleId'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const ASPIRATE_TOUCH_TIP_SPEED_REQUIRED: FormError = {
  title: 'Touch tip speed required',
  dependentFields: ['aspirate_touchTip_speed'],
  location: ['field'],
  page: 2,
  tab: 'aspirate',
}
const DISPENSE_TOUCH_TIP_SPEED_REQUIRED: FormError = {
  title: 'Touch tip speed required',
  dependentFields: ['dispense_touchTip_speed'],
  location: ['field'],
  page: 2,
  tab: 'dispense',
}
const ASPIRATE_TOUCH_TIP_MM_FROM_EDGE_OUT_OF_RANGE: FormError = {
  title: 'Value falls outside of accepted range',
  dependentFields: ['aspirate_touchTip_mmFromEdge'],
  location: ['field'],
  page: 2,
  tab: 'aspirate',
}
const DISPENSE_TOUCH_TIP_MM_FROM_EDGE_OUT_OF_RANGE: FormError = {
  title: 'Value falls outside of accepted range',
  dependentFields: ['dispense_touchTip_mmFromEdge'],
  location: ['field'],
  page: 2,
  tab: 'dispense',
}
const QUANTITY_OUT_OF_RANGE: FormError = {
  title: 'Value falls outside of expected range',
  dependentFields: ['fillLabwareIds'],
  showOnReopen: true,
  location: ['field'],
}
const ASPIRATE_TOUCH_TIP_MM_FROM_EDGE_REQUIRED: FormError = {
  title: 'Value required',
  dependentFields: ['aspirate_touchTip_mmFromEdge'],
  location: ['field'],
  page: 2,
  tab: 'aspirate',
}
const DISPENSE_TOUCH_TIP_MM_FROM_EDGE_REQUIRED: FormError = {
  title: 'Value required',
  dependentFields: ['dispense_touchTip_mmFromEdge'],
  location: ['field'],
  page: 2,
  tab: 'dispense',
}
const PUSH_OUT_VOLUME_REQUIRED: FormError = {
  title: 'Push out volume required',
  dependentFields: ['pushOut_volume'],
  location: ['field'],
  page: 2,
  tab: 'dispense',
}
const PUSH_OUT_VOLUME_OUT_OF_RANGE: FormError = {
  title: 'Push out volume out of range',
  dependentFields: ['pushOut_volume'],
  location: ['field'],
  page: 2,
  tab: 'dispense',
}
const CONDITIONING_VOLUME_REQUIRED: FormError = {
  title: 'Conditioning volume required',
  dependentFields: ['conditioning_volume'],
  location: ['field'],
  page: 2,
  tab: 'aspirate',
}
const CONDITIONING_VOLUME_OUT_OF_RANGE: FormError = {
  title: 'Conditioning volume out of range',
  dependentFields: ['conditioning_volume'],
  location: ['field'],
  page: 2,
  tab: 'aspirate',
}
const VOLUME_UNDER_MINIMUM: FormError = {
  title: RANGE_TITLE,
  dependentFields: ['volume'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const MESSAGE_REQUIRED: FormError = {
  title: 'Message required',
  dependentFields: ['message'],
  location: ['field'],
  showOnReopen: true,
}
const PIPETTE_REQUIRED: FormError = {
  title: 'Pipette required',
  dependentFields: ['pipette'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const TIPRACK_REQUIRED: FormError = {
  title: 'Tiprack required',
  dependentFields: ['tipRack'],
  location: ['field'],
  page: 0,
  showOnReopen: true,
}
const TARGET_TEMPERATURE_RANGE: FormError = {
  title: RANGE_TITLE,
  dependentFields: ['targetTemperature'],
  location: ['field'],
}
const TARGET_HEATER_SHAKER_TEMPERATURE_RANGE: FormError = {
  title: RANGE_TITLE,
  dependentFields: ['targetHeaterShakerTemperature'],
  location: ['field'],
}

const TARGET_HEATER_SHAKER_SPEED_RANGE: FormError = {
  title: RANGE_TITLE,
  dependentFields: ['targetSpeed'],
  location: ['field'],
}
const PAUSE_TIME_FORMAT: FormError = {
  title: 'Must be a valid time (hh:mm:ss)',
  dependentFields: ['pauseTime'],
  location: ['form'],
}
const PAUSE_TEMP_RANGE: FormError = {
  title: RANGE_TITLE,
  dependentFields: ['pauseTemperature'],
  location: ['field'],
}
const BLOCK_TARGET_TEMP_RANGE: FormError = {
  title: RANGE_TITLE,
  dependentFields: ['blockTargetTemp'],
  location: ['field'],
}
const LID_TARGET_TEMP_RANGE: FormError = {
  title: RANGE_TITLE,
  dependentFields: ['lidTargetTemp'],
  location: ['field'],
}
const PROFILE_TARGET_LID_TEMP_RANGE: FormError = {
  title: RANGE_TITLE,
  dependentFields: ['profileTargetLidTemp'],
  location: ['field'],
}
const PROFILE_VOLUME_RANGE: FormError = {
  title: `Enter a value between ${MIN_TC_PROFILE_VOLUME} and ${MAX_TC_PROFILE_VOLUME}`,
  dependentFields: ['profileVolume'],
  location: ['field'],
}
const ASPIRATE_SUBMERGE_SPEED_REQUIRED: FormError = {
  title: 'Submerge speed required',
  dependentFields: ['aspirate_submerge_speed'],
  location: ['field'],
  page: 2,
  showOnReopen: true,
  tab: 'aspirate',
}
const ASPIRATE_RETRACT_SPEED_REQUIRED: FormError = {
  title: 'Retract speed required',
  dependentFields: ['aspirate_retract_speed'],
  location: ['field'],
  page: 2,
  showOnReopen: true,
  tab: 'aspirate',
}
const DISPENSE_SUBMERGE_SPEED_REQUIRED: FormError = {
  title: 'Submerge speed required',
  dependentFields: ['dispense_submerge_speed'],
  location: ['field'],
  page: 2,
  showOnReopen: true,
  tab: 'dispense',
}
const DISPENSE_RETRACT_SPEED_REQUIRED: FormError = {
  title: 'Retract speed required',
  dependentFields: ['dispense_retract_speed'],
  location: ['field'],
  page: 2,
  showOnReopen: true,
  tab: 'dispense',
}
const DISPOSAL_VOLUME_REQUIRED: FormError = {
  title: 'Disposal volume required',
  dependentFields: ['disposalVolume_checkbox', 'disposalVolume_volume'],
  location: ['field'],
  page: 2,
  showOnReopen: true,
  tab: 'dispense',
}
const TIPS_SELECTED_REQUIRED: FormError = {
  title: 'Not enough tips selected for manual tip tracking.',
  dependentFields: ['tips_selected', 'tip_tracking'],
  location: ['form', 'field'],
  page: 3,
}
const VACUUM_PROGRAM_REQUIRED: FormError = {
  title: 'Select vacuum controls',
  dependentFields: ['programType'],
  location: ['form'],
}
const VACUUM_STATE_REQUIRED: FormError = {
  title: 'Select vacuum state',
  dependentFields: ['stateType'],
  location: ['form'],
}
const VACUUM_MODE_REQUIRED: FormError = {
  title: 'Select vacuum mode type',
  dependentFields: ['modeType'],
  location: ['form'],
}
const GAUGE_PRESSURE_REQUIRED: FormError = {
  title: 'Enter a valid gauge pressure value',
  dependentFields: ['pressureMbar'],
  location: ['field'],
}
const VACUUM_DURATION_REQUIRED: FormError = {
  title: 'Enter a valid duration',
  dependentFields: ['pumpDurationTime'],
  location: ['field'],
}
const VACUUM_PROFILE_REQUIRED: FormError = {
  title: 'Select vacuum profile',
  dependentFields: ['vacuumOrderedProfileIds', 'vacuumProfileItemsById'],
  location: ['field'],
}
const VACUUM_MODULE_ID_REQUIRED: FormError = {
  title: 'Select vacuum module',
  dependentFields: ['moduleId'],
  location: ['field'],
  showOnReopen: true,
}
const DROP_TIP_LOCATION_REQUIRED: FormError = {
  title: 'Select tip drop location',
  dependentFields: ['dropTip_location'],
  location: ['field'],
  page: 3,
  showOnReopen: true,
}

export type FormErrorChecker = (
  arg: HydratedFormData,
  moduleEntities?: ModuleEntities
) => FormError | null
// TODO: test these

/*******************
 ** Error Checkers **
 ********************/
export const incompatibleLabware = (
  fields: HydratedMixFormData
): FormError | null => {
  const { labware, pipette, nozzles } = fields
  if (!labware || !pipette) {
    return null
  }
  //  trashBin and wasteChute cannot mix into a labware
  return !canPipetteUseLabware(
    pipette.spec as PipetteV2Specs,
    nozzles,
    labware.def as LabwareDefinition2
  )
    ? INCOMPATIBLE_LABWARE
    : null
}
export const incompatibleDispenseLabware = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { dispense_labware, pipette, nozzles } = fields
  if (!dispense_labware || !pipette) {
    return null
  }
  return !canPipetteUseLabware(
    pipette.spec as PipetteV2Specs,
    nozzles,
    'def' in dispense_labware
      ? (dispense_labware.def as LabwareDefinition2)
      : undefined,
    'name' in dispense_labware ? (dispense_labware.name as string) : undefined
  )
    ? INCOMPATIBLE_DISPENSE_LABWARE
    : null
}
export const incompatibleAspirateLabware = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { aspirate_labware, pipette, nozzles } = fields
  if (!aspirate_labware || !pipette) {
    return null
  }
  //  trashBin and wasteChute cannot aspirate into a labware
  return !canPipetteUseLabware(
    pipette.spec as PipetteV2Specs,
    nozzles,
    aspirate_labware.def as LabwareDefinition2
  )
    ? INCOMPATIBLE_ASPIRATE_LABWARE
    : null
}

const isTimeFormat = (value?: string | null): boolean => {
  const timeRegex = new RegExp(/^\d{1,2}:(?:[0-5]?\d):(?:[0-5]?\d)$/g)
  return value != null && timeRegex.test(value)
}

export const pauseForTimeOrUntilTold = (
  fields: HydratedHeaterShakerFormData | HydratedPauseFormData
): FormError | null => {
  const { moduleId } = fields

  if ('pauseAction' in fields && fields.pauseAction === PAUSE_UNTIL_TIME) {
    const { hours, minutes, seconds } = getTimeFromForm(
      'pauseTime' in fields ? (fields.pauseTime ?? null) : null
    )
    // user selected pause for amount of time
    const totalSeconds = hours * 3600 + minutes * 60 + seconds
    return totalSeconds <= 0
      ? TIME_PARAM_REQUIRED
      : isTimeFormat(fields.pauseTime)
        ? null
        : PAUSE_TIME_FORMAT
  } else if (
    'pauseAction' in fields &&
    fields.pauseAction === PAUSE_UNTIL_TEMP
  ) {
    // user selected pause until temperature reached
    if (moduleId == null) {
      // missing module field (reached by deleting a module from deck)
      return MODULE_ID_REQUIRED
    }

    if ('pauseTemperature' in fields && !fields.pauseTemperature) {
      // missing temperature field
      return PAUSE_TEMP_PARAM_REQUIRED
    } else if (
      fields.pauseTemperature != null &&
      (parseInt(fields.pauseTemperature) > MAX_TEMP_MODULE_TEMP ||
        parseInt(fields.pauseTemperature) < MIN_TEMP_MODULE_TEMP)
    ) {
      return PAUSE_TEMP_RANGE
    }

    return null
  } else if (
    'pauseAction' in fields &&
    fields.pauseAction === PAUSE_UNTIL_RESUME
  ) {
    // user selected pause until resume
    return null
  } else if (
    'pauseAction' in fields &&
    fields.pauseAction === PAUSE_UNTIL_TC_PROFILE_COMPLETE
  ) {
    // This is a system-created pause step that's paired with a TC profile step.
    return null
  } else if (
    'pauseAction' in fields &&
    (fields.pauseAction === PAUSE_UNTIL_VACUUM_PROFILE_COMPLETE ||
      fields.pauseAction === PAUSE_UNTIL_VACUUM_STATE_COMPLETE)
  ) {
    // System-created pause steps paired with a Vacuum profile or timed pump step.
    return null
  } else {
    // user did not select a pause type
    return PAUSE_TYPE_REQUIRED
  }
}
export const wellRatioMoveLiquid = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { aspirate_wells, dispense_wells, dispense_labware } = fields
  const dispenseLabware =
    dispense_labware != null && 'name' in dispense_labware
      ? (dispense_labware.name ?? null)
      : null
  const isDispensingIntoTrash =
    dispenseLabware != null
      ? dispenseLabware === 'wasteChute' || dispenseLabware === 'trashBin'
      : false
  if (!aspirate_wells || (!isDispensingIntoTrash && !dispense_wells)) {
    return null
  }
  const wellRatioFormError = isDispensingIntoTrash
    ? WELL_RATIO_MOVE_LIQUID_INTO_WASTE_CHUTE
    : WELL_RATIO_MOVE_LIQUID

  return getWellRatio(
    aspirate_wells as string[],
    dispense_wells as string[],
    isDispensingIntoTrash
  ) != null
    ? null
    : wellRatioFormError
}
export const volumeTooHigh = (
  fields: HydratedMixFormData
): FormError | null => {
  const { pipette, tipRack } = fields
  if (!pipette || !tipRack) {
    // pipette is null if user deletes pipette
    // I haven't been able to reproduce when tipRack alone becomes null, but it
    // probably happens if the user deletes or changes the tip racks somehow.
    return null
  }
  const volume = Number(fields.volume)

  // TODO: change getPipetteCapacity() to use tipRack definition directly
  const pipetteCapacity = getPipetteCapacity(pipette, tipRack?.tiprackDefURI)
  if (
    !Number.isNaN(volume) &&
    !Number.isNaN(pipetteCapacity) &&
    volume > pipetteCapacity
  ) {
    return VOLUME_TOO_HIGH(pipetteCapacity)
  }

  return null
}
export const magnetActionRequired = (
  fields: HydratedMagnetFormData
): FormError | null => {
  const { magnetAction } = fields
  if (!magnetAction) return MAGNET_ACTION_TYPE_REQUIRED
  return null
}
export const engageHeightRequired = (
  fields: HydratedMagnetFormData
): FormError | null => {
  const { magnetAction, engageHeight } = fields
  return magnetAction === 'engage' && !engageHeight
    ? ENGAGE_HEIGHT_REQUIRED
    : null
}
export const moduleIdRequired = (
  fields:
    | HydratedMagnetFormData
    | HydratedTemperatureFormData
    | HydratedHeaterShakerFormData
    | HydratedFlexStackerFormData
): FormError | null => {
  const { moduleId } = fields
  if (moduleId == null) return MODULE_ID_REQUIRED
  return null
}
export const targetTemperatureRequired = (
  fields: HydratedTemperatureFormData
): FormError | null => {
  const { setTemperature, targetTemperature } = fields
  return JSON.parse(String(setTemperature ?? false)) && !targetTemperature
    ? TARGET_TEMPERATURE_REQUIRED
    : null
}
export const profileVolumeRequired = (
  fields: HydratedThermocyclerFormData
): FormError | null => {
  const { thermocyclerFormType, profileVolume } = fields
  return thermocyclerFormType === THERMOCYCLER_PROFILE && !profileVolume
    ? PROFILE_VOLUME_REQUIRED
    : null
}
export const profileTargetLidTempRequired = (
  fields: HydratedThermocyclerFormData
): FormError | null => {
  const { thermocyclerFormType, profileTargetLidTemp } = fields
  return thermocyclerFormType === THERMOCYCLER_PROFILE && !profileTargetLidTemp
    ? PROFILE_LID_TEMPERATURE_REQUIRED
    : null
}
export const blockTemperatureRequired = (
  fields: HydratedThermocyclerFormData
): FormError | null => {
  const { blockIsActive, blockTargetTemp } = fields
  return blockIsActive === true && !blockTargetTemp
    ? BLOCK_TEMPERATURE_REQUIRED
    : null
}
export const blockTargetTempRange = (
  fields: HydratedThermocyclerFormData
): FormError | null => {
  const { blockTargetTemp } = fields
  return blockTargetTemp != null &&
    (parseInt(blockTargetTemp) < MIN_TC_BLOCK_TEMP ||
      parseInt(blockTargetTemp) > MAX_TC_BLOCK_TEMP)
    ? BLOCK_TARGET_TEMP_RANGE
    : null
}
export const lidTargetTempRange = (
  fields: HydratedThermocyclerFormData
): FormError | null => {
  const { lidTargetTemp } = fields
  return lidTargetTemp != null &&
    (parseInt(lidTargetTemp) < MIN_TC_LID_TEMP ||
      parseInt(lidTargetTemp) > MAX_TC_LID_TEMP)
    ? LID_TARGET_TEMP_RANGE
    : null
}
export const profileTargetLidTempRange = (
  fields: HydratedThermocyclerFormData
): FormError | null => {
  const { profileTargetLidTemp } = fields
  return profileTargetLidTemp != null &&
    (parseInt(profileTargetLidTemp) < MIN_TC_LID_TEMP ||
      parseInt(profileTargetLidTemp) > MAX_TC_LID_TEMP)
    ? PROFILE_TARGET_LID_TEMP_RANGE
    : null
}
export const profileVolumeRange = (
  fields: HydratedThermocyclerFormData
): FormError | null => {
  const { profileVolume } = fields
  return profileVolume != null &&
    (parseInt(profileVolume) < MIN_TC_PROFILE_VOLUME ||
      parseInt(profileVolume) > MAX_TC_PROFILE_VOLUME)
    ? PROFILE_VOLUME_RANGE
    : null
}
export const lidTemperatureRequired = (
  fields: HydratedThermocyclerFormData
): FormError | null => {
  const { lidIsActive, lidTargetTemp } = fields
  return lidIsActive === true && !lidTargetTemp
    ? LID_TEMPERATURE_REQUIRED
    : null
}
export const shakeSpeedRequired = (
  fields: HydratedHeaterShakerFormData
): FormError | null => {
  const { targetSpeed, setShake } = fields
  return setShake && !targetSpeed ? SHAKE_SPEED_REQUIRED : null
}
export const shakeTimeRequired = (
  fields: HydratedHeaterShakerFormData
): FormError | null => {
  const { heaterShakerTimer, heaterShakerSetTimer } = fields

  let error = null
  if (heaterShakerSetTimer && !heaterShakerTimer) {
    error = SHAKE_TIME_REQUIRED
  } else if (heaterShakerSetTimer && !isTimeFormat(heaterShakerTimer)) {
    error = SHAKER_TIME_FORMAT
  }
  return error
}
export const fillQuantityOutOfRange = (
  fields: HydratedFlexStackerFormData
): FormError | null => {
  const { fillLabwareIds, flexStackerFormType } = fields
  return (fillLabwareIds === null || fillLabwareIds.length === 0) &&
    flexStackerFormType === 'fill'
    ? QUANTITY_OUT_OF_RANGE
    : null
}

export const temperatureRequired = (
  fields: HydratedHeaterShakerFormData
): FormError | null => {
  const { setHeaterShakerTemperature, targetHeaterShakerTemperature } = fields
  return setHeaterShakerTemperature && !targetHeaterShakerTemperature
    ? HS_TEMPERATURE_REQUIRED
    : null
}
export const pauseActionRequired = (
  fields: HydratedPauseFormData
): FormError | null => {
  const { pauseAction } = fields
  return pauseAction == null ? PAUSE_ACTION_REQUIRED : null
}
export const pauseModuleRequired = (
  fields: HydratedPauseFormData
): FormError | null => {
  const { moduleId, pauseAction } = fields
  const expectingModuleId =
    pauseAction === PAUSE_UNTIL_TEMP ||
    pauseAction === PAUSE_UNTIL_TC_PROFILE_COMPLETE ||
    pauseAction === PAUSE_UNTIL_VACUUM_PROFILE_COMPLETE ||
    pauseAction === PAUSE_UNTIL_VACUUM_STATE_COMPLETE
  return expectingModuleId && moduleId == null ? PAUSE_MODULE_REQUIRED : null
}
export const pauseTemperatureRequired = (
  fields: HydratedPauseFormData
): FormError | null => {
  const { pauseTemperature, pauseAction } = fields
  return pauseAction === PAUSE_UNTIL_TEMP && !pauseTemperature
    ? PAUSE_TEMP_REQUIRED
    : null
}
export const labwareToMoveRequired = (
  fields: HydratedMoveLabwareFormData
): FormError | null => {
  const { labware } = fields
  return labware == null ? LABWARE_TO_MOVE_REQUIRED : null
}
export const newLabwareLocationRequired = (
  fields: HydratedMoveLabwareFormData
): FormError | null => {
  const { newLocation } = fields
  return newLocation == null ||
    Object.values(newLocation as Object).every(val => val == null)
    ? NEW_LABWARE_LOCATION_REQUIRED
    : null
}
export const magneticModuleIdRequired = (
  fields: HydratedMagnetFormData
): FormError | null => {
  const { moduleId } = fields
  return moduleId == null ? MAGNETIC_MODULE_ID_REQUIRED : null
}
export const engageHeightRangeExceeded = (
  fields: HydratedMagnetFormData,
  moduleEntities?: ModuleEntities
): FormError | null => {
  const { magnetAction, engageHeight, moduleId } = fields
  if (moduleEntities == null) {
    return null
  }
  const moduleModel = moduleEntities[moduleId]?.model
  const engageHeightCast = Number(engageHeight)
  if (magnetAction === 'engage') {
    if (moduleModel === MAGNETIC_MODULE_V1) {
      if (engageHeightCast < MIN_ENGAGE_HEIGHT_V1) {
        return ENGAGE_HEIGHT_MIN_EXCEEDED
      } else if (engageHeightCast > MAX_ENGAGE_HEIGHT_V1) {
        return ENGAGE_HEIGHT_MAX_EXCEEDED
      }
    } else if (moduleModel === MAGNETIC_MODULE_V2) {
      if (engageHeightCast < MIN_ENGAGE_HEIGHT_V2) {
        return ENGAGE_HEIGHT_MIN_EXCEEDED
      } else if (engageHeightCast > MAX_ENGAGE_HEIGHT_V2) {
        return ENGAGE_HEIGHT_MAX_EXCEEDED
      }
    } else {
      console.warn(
        `unhandled model for engageHeightRangeExceeded: ${moduleModel}`
      )
    }
  }

  return null
}
export const aspirateWellsRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { aspirate_wells } = fields
  return aspirate_wells == null || aspirate_wells.length === 0
    ? ASPIRATE_WELLS_REQUIRED
    : null
}
export const dispenseWellsRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { dispense_wells, dispense_labware } = fields
  return (dispense_wells == null || dispense_wells.length === 0) &&
    !(
      dispense_labware != null &&
      'name' in dispense_labware &&
      (dispense_labware.name === 'wasteChute' ||
        dispense_labware.name === 'trashBin')
    )
    ? DISPENSE_WELLS_REQUIRED
    : null
}
export const mixWellsRequired = (
  fields: HydratedMixFormData
): FormError | null => {
  const { wells } = fields
  return wells == null || wells.length === 0 ? MIX_WELLS_REQUIRED : null
}
export const volumeRequired = (
  fields: HydratedMixFormData | HydratedMoveLiquidFormData
): FormError | null => {
  const { volume } = fields
  return !volume ? VOLUME_REQUIRED : null
}
export const timesRequired = (
  fields: HydratedMixFormData
): FormError | null => {
  const { times } = fields
  return !times ? TIMES_REQUIRED : null
}
export const aspirateLabwareRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { aspirate_labware } = fields
  return aspirate_labware == null ? ASPIRATE_LABWARE_REQUIRED : null
}
export const dispenseLabwareRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { dispense_labware } = fields
  return dispense_labware == null ? DISPENSE_LABWARE_REQUIRED : null
}
export const mixLabwareRequired = (
  fields: HydratedMixFormData
): FormError | null => {
  const { labware } = fields
  return labware == null ? MIX_LABWARE_REQUIRED : null
}
export const aspirateMixTimesRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { aspirate_mix_checkbox, aspirate_mix_times } = fields
  return aspirate_mix_checkbox && !aspirate_mix_times
    ? ASPIRATE_MIX_TIMES_REQUIRED
    : null
}
export const aspirateMixVolumeRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { aspirate_mix_checkbox, aspirate_mix_volume } = fields
  return aspirate_mix_checkbox && !aspirate_mix_volume
    ? ASPIRATE_MIX_VOLUME_REQUIRED
    : null
}
export const aspirateDelayDurationRequired = (
  fields: HydratedMixFormData | HydratedMoveLiquidFormData
): FormError | null => {
  const { aspirate_delay_seconds, aspirate_delay_checkbox } = fields
  return aspirate_delay_checkbox && !aspirate_delay_seconds
    ? ASPIRATE_DELAY_DURATION_REQUIRED
    : null
}
export const aspirateAirGapVolumeRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { aspirate_airGap_checkbox, aspirate_airGap_volume } = fields
  return aspirate_airGap_checkbox && !aspirate_airGap_volume
    ? ASPIRATE_AIRGAP_VOLUME_REQUIRED
    : null
}
export const dispenseMixTimesRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { dispense_mix_checkbox, dispense_mix_times } = fields
  return dispense_mix_checkbox && !dispense_mix_times
    ? DISPENSE_MIX_TIMES_REQUIRED
    : null
}
export const dispenseMixVolumeRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { dispense_mix_checkbox, dispense_mix_volume } = fields
  return dispense_mix_checkbox && !dispense_mix_volume
    ? DISPENSE_MIX_VOLUME_REQUIRED
    : null
}
export const dispenseDelayDurationRequired = (
  fields: HydratedMixFormData | HydratedMoveLiquidFormData
): FormError | null => {
  const { dispense_delay_seconds, dispense_delay_checkbox } = fields
  return dispense_delay_checkbox && !dispense_delay_seconds
    ? DISPENSE_DELAY_DURATION_REQUIRED
    : null
}
export const tiprackRequired = (
  fields: HydratedMixFormData | HydratedMoveLiquidFormData
): FormError | null => {
  const { tipRack } = fields
  return !tipRack ? TIPRACK_REQUIRED : null
}
export const dispenseAirGapVolumeRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { dispense_airGap_checkbox, dispense_airGap_volume } = fields
  return dispense_airGap_checkbox && !dispense_airGap_volume
    ? DISPENSE_AIRGAP_VOLUME_REQUIRED
    : null
}
export const blowoutLocationRequired = (
  fields: HydratedMixFormData | HydratedMoveLiquidFormData
): FormError | null => {
  const { blowout_checkbox, blowout_location } = fields
  const isDisposalChecked =
    'disposalVolume_checkbox' in fields &&
    'path' in fields &&
    fields.disposalVolume_checkbox &&
    fields.path === 'multiDispense'
  return (blowout_checkbox || isDisposalChecked) && blowout_location == null
    ? BLOWOUT_LOCATION_REQUIRED
    : null
}
export const blowoutFlowRateRequired = (
  fields: HydratedMixFormData | HydratedMoveLiquidFormData
): FormError | null => {
  const { blowout_checkbox, blowout_flowRate } = fields
  const isDisposalChecked =
    'disposalVolume_checkbox' in fields &&
    'path' in fields &&
    fields.disposalVolume_checkbox &&
    fields.path === 'multiDispense'
  return (blowout_checkbox || isDisposalChecked) && !blowout_flowRate
    ? BLOWOUT_FLOW_RATE_REQUIRED
    : null
}
export const wavelengthRequired = (
  fields: HydratedAbsorbanceReaderFormData
): FormError | null => {
  const { absorbanceReaderFormType, wavelengths, mode } = fields
  if (!wavelengths) {
    return null
  }
  const wavelengthsToCheck = wavelengths.slice(
    0,
    mode === 'single' ? 1 : wavelengths.length
  )

  return wavelengthsToCheck?.some(wavelength => !wavelength) &&
    absorbanceReaderFormType === ABSORBANCE_READER_INITIALIZE
    ? WAVELENGTH_REQUIRED
    : null
}
export const referenceWavelengthRequired = (
  fields: HydratedAbsorbanceReaderFormData
): FormError | null => {
  const {
    absorbanceReaderFormType,
    referenceWavelength,
    referenceWavelengthActive,
  } = fields
  return referenceWavelengthActive &&
    !referenceWavelength &&
    absorbanceReaderFormType === ABSORBANCE_READER_INITIALIZE
    ? REFERENCE_WAVELENGTH_REQUIRED
    : null
}
export const absorbanceReaderModuleIdRequired = (
  fields: HydratedAbsorbanceReaderFormData
): FormError | null => {
  const { moduleId } = fields
  if (moduleId == null) return ABSORBANCE_READER_MODULE_ID_REQUIRED
  return null
}
export const wavelengthOutOfRange = (
  fields: HydratedAbsorbanceReaderFormData
): FormError | null => {
  const { absorbanceReaderFormType, wavelengths, mode } = fields
  if (
    !wavelengths ||
    absorbanceReaderFormType !== ABSORBANCE_READER_INITIALIZE
  ) {
    return null
  }
  const wavelengthsToCheck = wavelengths.slice(
    0,
    mode === 'single' ? 1 : wavelengths.length
  )
  return wavelengthsToCheck.some(
    (wavelength: any) =>
      getIsOutOfRange(
        wavelength,
        ABSORBANCE_READER_MIN_WAVELENGTH_NM,
        ABSORBANCE_READER_MAX_WAVELENGTH_NM
      ) && wavelength
  )
    ? WAVELENGTH_OUT_OF_RANGE
    : null
}
export const referenceWavelengthOutOfRange = (
  fields: HydratedAbsorbanceReaderFormData
): FormError | null => {
  const { absorbanceReaderFormType, referenceWavelength } = fields
  if (
    !referenceWavelength ||
    absorbanceReaderFormType !== ABSORBANCE_READER_INITIALIZE
  ) {
    return null
  }
  return getIsOutOfRange(
    referenceWavelength,
    ABSORBANCE_READER_MIN_WAVELENGTH_NM,
    ABSORBANCE_READER_MAX_WAVELENGTH_NM
  )
    ? REFERENCE_WAVELENGTH_OUT_OF_RANGE
    : null
}
export const fileNameRequired = (
  fields: HydratedAbsorbanceReaderFormData
): FormError | null => {
  const { absorbanceReaderFormType, fileName } = fields
  return !fileName && absorbanceReaderFormType === ABSORBANCE_READER_READ
    ? FILENAME_REQUIRED
    : null
}
export const aspirateTouchTipSpeedRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { aspirate_touchTip_speed, aspirate_touchTip_checkbox } = fields
  return aspirate_touchTip_checkbox && !aspirate_touchTip_speed
    ? ASPIRATE_TOUCH_TIP_SPEED_REQUIRED
    : null
}
export const dispenseTouchTipSpeedRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { dispense_touchTip_speed, dispense_touchTip_checkbox } = fields
  return dispense_touchTip_checkbox && !dispense_touchTip_speed
    ? DISPENSE_TOUCH_TIP_SPEED_REQUIRED
    : null
}
export const aspirateTouchTipMmFromEdgeOutOfRange = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const {
    aspirate_touchTip_checkbox,
    aspirate_touchTip_mmFromEdge,
    aspirate_labware,
  } = fields
  if (aspirate_touchTip_checkbox == null) {
    return null
  }
  const labwareDef = aspirate_labware?.def
  if (labwareDef == null) {
    return null
  }
  const minDimension = getMinXYDimension(labwareDef as LabwareDefinition2, [
    'A1',
  ])
  if (minDimension == null) {
    return null
  }
  const maxRadius = minDimension / 2
  if (
    Number(aspirate_touchTip_mmFromEdge) > maxRadius ||
    Number(aspirate_touchTip_mmFromEdge) < 0
  ) {
    return ASPIRATE_TOUCH_TIP_MM_FROM_EDGE_OUT_OF_RANGE
  }
  return null
}
export const dispenseTouchTipMmFromEdgeOutOfRange = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const {
    dispense_touchTip_checkbox,
    dispense_touchTip_mmFromEdge,
    dispense_labware,
  } = fields
  if (dispense_touchTip_checkbox == null) {
    return null
  }
  const labwareDef =
    dispense_labware != null && 'def' in dispense_labware
      ? dispense_labware.def
      : null
  if (labwareDef == null) {
    return null
  }
  const minDimension = getMinXYDimension(labwareDef as LabwareDefinition2, [
    'A1',
  ])
  if (minDimension == null) {
    return null
  }
  const maxRadius = minDimension / 2
  if (
    Number(dispense_touchTip_mmFromEdge) > maxRadius ||
    Number(dispense_touchTip_mmFromEdge) < 0
  ) {
    return DISPENSE_TOUCH_TIP_MM_FROM_EDGE_OUT_OF_RANGE
  }
  return null
}
export const aspirateTouchTipMmFromEdgeRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { aspirate_touchTip_checkbox, aspirate_touchTip_mmFromEdge } = fields
  return aspirate_touchTip_checkbox &&
    !aspirate_touchTip_mmFromEdge &&
    aspirate_touchTip_mmFromEdge !== 0
    ? ASPIRATE_TOUCH_TIP_MM_FROM_EDGE_REQUIRED
    : null
}
export const dispenseTouchTipMmFromEdgeRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { dispense_touchTip_checkbox, dispense_touchTip_mmFromEdge } = fields
  return dispense_touchTip_checkbox &&
    !dispense_touchTip_mmFromEdge &&
    dispense_touchTip_mmFromEdge !== 0
    ? DISPENSE_TOUCH_TIP_MM_FROM_EDGE_REQUIRED
    : null
}
export const pushOutVolumeRequired = (
  fields: HydratedMoveLiquidFormData | HydratedMixFormData
): FormError | null => {
  const { pushOut_checkbox, pushOut_volume } = fields
  return pushOut_checkbox && !pushOut_volume ? PUSH_OUT_VOLUME_REQUIRED : null
}
export const pushOutVolumeOutOfRange = (
  fields: HydratedMoveLiquidFormData | HydratedMixFormData
): FormError | null => {
  const { pushOut_checkbox, pushOut_volume, pipette, volume } = fields
  if (pipette == null || pushOut_volume == null) {
    return null
  }
  const maxPushOutVolume = getMaxPushOutVolume(
    Number(volume),
    (pipette as PipetteEntity).spec
  )
  return pushOut_checkbox && pushOut_volume > maxPushOutVolume
    ? PUSH_OUT_VOLUME_OUT_OF_RANGE
    : null
}
export const conditioningVolumeRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { conditioning_checkbox, conditioning_volume, path } = fields
  return conditioning_checkbox &&
    !conditioning_volume &&
    path === 'multiDispense'
    ? CONDITIONING_VOLUME_REQUIRED
    : null
}
export const conditioningVolumeOutOfRange = (
  fields: HydratedMoveLiquidFormData,
  moduleEntities?: ModuleEntities,
  labwareEntities?: LabwareEntities
): FormError | null => {
  const {
    path,
    conditioning_checkbox,
    conditioning_volume,
    pipette,
    volume,
    disposalVolume_checkbox,
    disposalVolume_volume,
    tipRack,
  } = fields
  if (
    pipette == null ||
    conditioning_volume == null ||
    path !== 'multiDispense'
  ) {
    return null
  }
  const maxConditioningVolume = getMaxConditioningVolume({
    transferVolume: Number(volume),
    disposalVolume:
      disposalVolume_checkbox === true ? Number(disposalVolume_volume) : 0,
    pipetteSpecs: pipette.spec,
    tiprackDef: tipRack,
  })
  return conditioning_checkbox && conditioning_volume > maxConditioningVolume
    ? CONDITIONING_VOLUME_OUT_OF_RANGE
    : null
}

export const getIsOutOfRange = (
  value: any,
  min: number,
  max: number
): boolean => {
  const castValue = Number(value)
  return castValue < min || castValue > max
}

export const transferVolumeMin = (
  fields: HydratedMoveLiquidFormData | HydratedMixFormData
): FormError | null => {
  const { volume } = fields
  return volume < MIN_TRANSFER_VOLUME ? VOLUME_UNDER_MINIMUM : null
}

export const messageRequired = (
  fields: HydratedCommentFormData
): FormError | null => {
  const { message } = fields
  return message == null ? MESSAGE_REQUIRED : null
}

export const pipetteRequired = (
  fields: HydratedMoveLiquidFormData | HydratedMixFormData
): FormError | null => {
  const { pipette } = fields
  return pipette == null ? PIPETTE_REQUIRED : null
}

export const targetTemperatureRange = (
  fields: HydratedTemperatureFormData
): FormError | null => {
  const { targetTemperature } = fields
  return targetTemperature != null &&
    (parseInt(targetTemperature) < MIN_TEMP_MODULE_TEMP ||
      parseInt(targetTemperature) > MAX_TEMP_MODULE_TEMP)
    ? TARGET_TEMPERATURE_RANGE
    : null
}

export const targetHeaterShakerTemperatureRange = (
  fields: HydratedHeaterShakerFormData
): FormError | null => {
  const { targetHeaterShakerTemperature } = fields
  return targetHeaterShakerTemperature != null &&
    (parseInt(targetHeaterShakerTemperature) < MIN_HEATER_SHAKER_MODULE_TEMP ||
      parseInt(targetHeaterShakerTemperature) > MAX_HEATER_SHAKER_MODULE_TEMP)
    ? TARGET_HEATER_SHAKER_TEMPERATURE_RANGE
    : null
}

export const targetSpeedRange = (
  fields: HydratedHeaterShakerFormData
): FormError | null => {
  const { targetSpeed } = fields
  return targetSpeed != null &&
    (parseInt(targetSpeed) < MIN_HEATER_SHAKER_MODULE_RPM ||
      parseInt(targetSpeed) > MAX_HEATER_SHAKER_MODULE_RPM)
    ? TARGET_HEATER_SHAKER_SPEED_RANGE
    : null
}

const _getIsDispenseTrash = (
  dispenseLabware: LabwareOrAdditionalEquipmentEntity | null
): boolean =>
  dispenseLabware != null &&
  'name' in dispenseLabware &&
  (dispenseLabware.name === 'trashBin' || dispenseLabware.name === 'wasteChute')

export const aspirateSubmergeSpeedRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { aspirate_submerge_speed, dispense_labware = null } = fields
  const isDispenseTrash = _getIsDispenseTrash(dispense_labware)
  return !aspirate_submerge_speed && !isDispenseTrash
    ? ASPIRATE_SUBMERGE_SPEED_REQUIRED
    : null
}
export const aspirateRetractSpeedRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { aspirate_retract_speed, dispense_labware } = fields
  const isDispenseTrash = _getIsDispenseTrash(dispense_labware)
  return !aspirate_retract_speed && !isDispenseTrash
    ? ASPIRATE_RETRACT_SPEED_REQUIRED
    : null
}
export const dispenseSubmergeSpeedRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { dispense_submerge_speed, dispense_labware } = fields
  const isDispenseTrash = _getIsDispenseTrash(dispense_labware)
  return !dispense_submerge_speed && !isDispenseTrash
    ? DISPENSE_SUBMERGE_SPEED_REQUIRED
    : null
}
export const dispenseRetractSpeedRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { dispense_retract_speed, dispense_labware } = fields
  const isDispenseTrash = _getIsDispenseTrash(dispense_labware)
  return !dispense_retract_speed && !isDispenseTrash
    ? DISPENSE_RETRACT_SPEED_REQUIRED
    : null
}
export const disposalVolumeRequired = (
  fields: HydratedMoveLiquidFormData
): FormError | null => {
  const { disposalVolume_checkbox, disposalVolume_volume, path } = fields
  return disposalVolume_checkbox &&
    !disposalVolume_volume &&
    path === 'multiDispense'
    ? DISPOSAL_VOLUME_REQUIRED
    : null
}

export const tipSelectionRequired = (
  fields: HydratedMixFormData | HydratedMoveLiquidFormData
): FormError | null => {
  const { tips_selected, tip_tracking } = fields
  return tip_tracking === MANUAL &&
    (tips_selected == null || tips_selected?.length === 0)
    ? TIPS_SELECTED_REQUIRED
    : null
}

export const vacuumProgramRequired = (
  fields: HydratedVacuumFormData
): FormError | null => {
  const { programType } = fields
  return programType == null ? VACUUM_PROGRAM_REQUIRED : null
}

export const vacuumStateRequired = (
  fields: HydratedVacuumFormData
): FormError | null => {
  const { programType, stateType } = fields
  return programType === VACUUM_PROGRAM_STATE && stateType == null
    ? VACUUM_STATE_REQUIRED
    : null
}

export const vacuumModeRequired = (
  fields: HydratedVacuumFormData
): FormError | null => {
  const { programType, modeType, stateType } = fields
  return modeType == null &&
    programType === VACUUM_PROGRAM_STATE &&
    stateType === VACUUM_STATE_PUMP_ON
    ? VACUUM_MODE_REQUIRED
    : null
}

export const vacuumProfileRequired = (
  fields: HydratedVacuumFormData
): FormError | null => {
  const { programType, vacuumOrderedProfileIds } = fields
  return programType === VACUUM_PROGRAM_PROFILE &&
    vacuumOrderedProfileIds.length === 0
    ? VACUUM_PROFILE_REQUIRED
    : null
}

export const gaugePressureRequired = (
  fields: HydratedVacuumFormData
): FormError | null => {
  const { programType, stateType, modeType, pressureMbar } = fields
  return programType === VACUUM_PROGRAM_STATE &&
    stateType === VACUUM_STATE_PUMP_ON &&
    modeType === VACUUM_MODE_PRESSURE &&
    (pressureMbar == null ||
      pressureMbar < VACUUM_MIN_PRESSURE_MBAR ||
      pressureMbar > VACUUM_MAX_PRESSURE_MBAR)
    ? GAUGE_PRESSURE_REQUIRED
    : null
}
export const vacuumDurationRequired = (
  fields: HydratedVacuumFormData
): FormError | null => {
  const { programType, stateType, pumpDurationCheckbox, pumpDurationTime } =
    fields
  return programType === VACUUM_PROGRAM_STATE &&
    stateType === VACUUM_STATE_PUMP_ON &&
    pumpDurationCheckbox === true &&
    !pumpDurationTime
    ? VACUUM_DURATION_REQUIRED
    : null
}
export const tipDropLocationRequired = (
  fields: HydratedMixFormData | HydratedMoveLiquidFormData
): FormError | null => {
  const { dropTip_location } = fields
  return dropTip_location == null ? DROP_TIP_LOCATION_REQUIRED : null
}

export const vacuumModuleIdRequired = (
  fields: HydratedVacuumFormData
): FormError | null => {
  const { moduleId } = fields
  return moduleId == null ? VACUUM_MODULE_ID_REQUIRED : null
}

/*******************
 **     Helpers    **
 ********************/
type ComposeErrors = <T extends HydratedFormData>(
  ...errorCheckers: Array<
    (
      fields: T,
      moduleEntities?: ModuleEntities,
      labwareEntities?: LabwareEntities
    ) => FormError | null
  >
) => (
  arg: T,
  moduleEntities?: ModuleEntities,
  labwareEntities?: LabwareEntities
) => FormError[]

export const composeErrors: ComposeErrors =
  <T extends HydratedFormData>(
    ...errorCheckers: Array<
      (
        fields: T,
        moduleEntities?: ModuleEntities,
        labwareEntities?: LabwareEntities
      ) => FormError | null
    >
  ) =>
  (
    formData: T,
    moduleEntities?: ModuleEntities,
    labwareEntities?: LabwareEntities
  ) =>
    errorCheckers
      .map(checker => checker(formData, moduleEntities, labwareEntities))
      .filter((error): error is FormError => error !== null)
