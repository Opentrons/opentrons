import {
  requiredField,
  minimumWellCount,
  nonZero,
  composeErrors,
  minFieldValue,
  maxFieldValue,
  temperatureRangeFieldValue,
  realNumber,
} from './errors'
import {
  maskToInteger,
  maskToFloat,
  numberOrNull,
  onlyPositiveNumbers,
  defaultTo,
  composeMaskers,
  trimDecimals,
  ValueMasker,
  ValueCaster,
} from './processing'
import {
  MIN_TEMP_MODULE_TEMP,
  MAX_TEMP_MODULE_TEMP,
  MIN_HEATER_SHAKER_MODULE_TEMP,
  MAX_HEATER_SHAKER_MODULE_TEMP,
  MIN_TC_BLOCK_TEMP,
  MAX_TC_BLOCK_TEMP,
  MIN_TC_LID_TEMP,
  MAX_TC_LID_TEMP,
  MIN_TC_DURATION_SECONDS,
  MAX_TC_DURATION_SECONDS,
  MIN_HEATER_SHAKER_MODULE_RPM,
  MAX_HEATER_SHAKER_MODULE_RPM,
  MIN_HEATER_SHAKER_DURATION_SECONDS,
  MAX_HEATER_SHAKER_DURATION_SECONDS,
  MIN_TC_PROFILE_VOLUME,
  MAX_TC_PROFILE_VOLUME,
} from '../../constants'
import {
  LabwareEntity,
  PipetteEntity,
  InvariantContext,
} from '@opentrons/step-generation'
import { StepFieldName } from '../../form-types'
import { LabwareLocation } from '@opentrons/shared-data'
export type { StepFieldName }

const getLabwareEntity = (
  state: InvariantContext,
  id: string
): LabwareEntity | null => {
  return state.labwareEntities[id] || null
}

const getLabwareLocation = (
  state: InvariantContext,
  newLocationString: string
): LabwareLocation | null => {
  if (newLocationString === 'offDeck') {
    return 'offDeck'
  } else if (newLocationString in state.moduleEntities) {
    return { moduleId: newLocationString }
  } else {
    // assume it is a slot
    return { slotName: newLocationString }
  }
}

const getPipetteEntity = (
  state: InvariantContext,
  id: string
): PipetteEntity | null => {
  return state.pipetteEntities[id] || null
}

interface StepFieldHelpers {
  getErrors?: (arg0: unknown) => string[]
  maskValue?: ValueMasker
  castValue?: ValueCaster
  hydrate?: (state: InvariantContext, id: string) => unknown
}
const stepFieldHelperMap: Record<StepFieldName, StepFieldHelpers> = {
  aspirate_airGap_volume: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  },
  aspirate_labware: {
    getErrors: composeErrors(requiredField),
    hydrate: getLabwareEntity,
  },
  aspirate_mix_times: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers, defaultTo(1)),
    castValue: Number,
  },
  aspirate_mix_volume: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  },
  aspirate_mmFromBottom: {
    castValue: Number,
  },
  aspirate_wells: {
    getErrors: composeErrors(requiredField, minimumWellCount(1)),
    maskValue: defaultTo([]),
  },
  dispense_airGap_volume: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  },
  dispense_labware: {
    getErrors: composeErrors(requiredField),
    hydrate: getLabwareEntity,
  },
  dispense_mix_times: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers, defaultTo(1)),
    castValue: Number,
  },
  dispense_mix_volume: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  },
  dispense_mmFromBottom: {
    castValue: Number,
  },
  dispense_wells: {
    getErrors: composeErrors(requiredField, minimumWellCount(1)),
    maskValue: defaultTo([]),
  },
  disposalVolume_volume: {
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1)
    ),
    castValue: Number,
  },
  labware: {
    getErrors: composeErrors(requiredField),
    hydrate: getLabwareEntity,
  },
  aspirate_delay_seconds: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers, defaultTo(1)),
    castValue: Number,
  },
  aspirate_delay_mmFromBottom: {
    castValue: numberOrNull,
  },
  dispense_delay_seconds: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers, defaultTo(1)),
    castValue: Number,
  },
  dispense_delay_mmFromBottom: {
    castValue: numberOrNull,
  },
  pauseHour: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
  },
  pauseMinute: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
  },
  pauseSecond: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
  },
  pipette: {
    getErrors: composeErrors(requiredField),
    hydrate: getPipetteEntity,
  },
  times: {
    getErrors: composeErrors(requiredField),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers, defaultTo(0)),
    castValue: Number,
  },
  volume: {
    getErrors: composeErrors(requiredField, nonZero),
    maskValue: composeMaskers(
      maskToFloat,
      onlyPositiveNumbers,
      trimDecimals(1),
      defaultTo(0)
    ),
    castValue: Number,
  },
  wells: {
    getErrors: composeErrors(requiredField, minimumWellCount(1)),
    maskValue: defaultTo([]),
  },
  magnetAction: {
    getErrors: composeErrors(requiredField),
  },
  engageHeight: {
    getErrors: composeErrors(realNumber),
    maskValue: composeMaskers(maskToFloat, trimDecimals(1)),
    castValue: Number,
  },
  setTemperature: {
    getErrors: composeErrors(requiredField),
  },
  targetTemperature: {
    getErrors: composeErrors(
      minFieldValue(MIN_TEMP_MODULE_TEMP),
      maxFieldValue(MAX_TEMP_MODULE_TEMP)
    ),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  targetHeaterShakerTemperature: {
    getErrors: composeErrors(
      minFieldValue(MIN_HEATER_SHAKER_MODULE_TEMP),
      maxFieldValue(MAX_HEATER_SHAKER_MODULE_TEMP)
    ),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  targetSpeed: {
    getErrors: composeErrors(
      minFieldValue(MIN_HEATER_SHAKER_MODULE_RPM),
      maxFieldValue(MAX_HEATER_SHAKER_MODULE_RPM)
    ),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  heaterShakerTimerMinutes: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  heaterShakerTimerSeconds: {
    getErrors: composeErrors(
      minFieldValue(MIN_HEATER_SHAKER_DURATION_SECONDS),
      maxFieldValue(MAX_HEATER_SHAKER_DURATION_SECONDS)
    ),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  pauseAction: {
    getErrors: composeErrors(requiredField),
  },
  pauseTemperature: {
    getErrors: composeErrors(
      minFieldValue(MIN_TEMP_MODULE_TEMP),
      maxFieldValue(MAX_TEMP_MODULE_TEMP)
    ),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  blockTargetTemp: {
    getErrors: composeErrors(
      temperatureRangeFieldValue(MIN_TC_BLOCK_TEMP, MAX_TC_BLOCK_TEMP)
    ),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  lidTargetTemp: {
    getErrors: composeErrors(
      temperatureRangeFieldValue(MIN_TC_LID_TEMP, MAX_TC_LID_TEMP)
    ),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  profileTargetLidTemp: {
    getErrors: composeErrors(
      temperatureRangeFieldValue(MIN_TC_LID_TEMP, MAX_TC_LID_TEMP)
    ),
  },
  profileVolume: {
    getErrors: composeErrors(
      minFieldValue(MIN_TC_PROFILE_VOLUME),
      maxFieldValue(MAX_TC_PROFILE_VOLUME)
    ),
  },
  blockTargetTempHold: {
    getErrors: composeErrors(
      temperatureRangeFieldValue(MIN_TC_BLOCK_TEMP, MAX_TC_BLOCK_TEMP)
    ),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  lidTargetTempHold: {
    getErrors: composeErrors(
      temperatureRangeFieldValue(MIN_TC_LID_TEMP, MAX_TC_LID_TEMP)
    ),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  mix_mmFromBottom: {
    castValue: Number,
  },
  newLocation: {
    hydrate: getLabwareLocation,
  },
}
const profileFieldHelperMap: Record<string, StepFieldHelpers> = {
  // profile step fields
  temperature: {
    getErrors: composeErrors(
      requiredField,
      minFieldValue(MIN_TC_BLOCK_TEMP),
      maxFieldValue(MAX_TC_BLOCK_TEMP)
    ),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  durationMinutes: {
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  durationSeconds: {
    getErrors: composeErrors(
      minFieldValue(MIN_TC_DURATION_SECONDS),
      maxFieldValue(MAX_TC_DURATION_SECONDS)
    ),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
  // profile cycle fields
  repetitions: {
    getErrors: composeErrors(requiredField),
    maskValue: composeMaskers(maskToInteger, onlyPositiveNumbers),
    castValue: Number,
  },
}
export const getFieldErrors = (
  name: StepFieldName,
  value: unknown
): string[] => {
  const fieldErrorGetter =
    stepFieldHelperMap[name] && stepFieldHelperMap[name].getErrors
  const errors = fieldErrorGetter ? fieldErrorGetter(value) : []
  return errors
}
export const getProfileFieldErrors = (
  name: string,
  value: unknown
): string[] => {
  const fieldErrorGetter =
    profileFieldHelperMap[name] && profileFieldHelperMap[name].getErrors
  const errors = fieldErrorGetter ? fieldErrorGetter(value) : []
  return errors
}
export const castField = (name: StepFieldName, value: unknown): unknown => {
  const fieldCaster =
    stepFieldHelperMap[name] && stepFieldHelperMap[name].castValue
  return fieldCaster ? fieldCaster(value) : value
}
export const maskField = (name: StepFieldName, value: unknown): unknown => {
  const fieldMasker =
    stepFieldHelperMap[name] && stepFieldHelperMap[name].maskValue
  return fieldMasker ? fieldMasker(value) : value
}
export const maskProfileField = (name: string, value: unknown): unknown => {
  const fieldMasker =
    profileFieldHelperMap[name] && profileFieldHelperMap[name].maskValue
  return fieldMasker ? fieldMasker(value) : value
}
export const hydrateField = (
  state: InvariantContext,
  name: StepFieldName,
  value: string
): unknown => {
  const hydrator = stepFieldHelperMap[name] && stepFieldHelperMap[name].hydrate
  return hydrator ? hydrator(state, value) : value
}
