// @flow
import { getLabware } from '@opentrons/shared-data'
import {
  requiredField,
  minimumWellCount,
  nonZero,
  composeErrors,
} from './errors'
import {
  maskToNumber,
  maskToFloat,
  onlyPositiveNumbers,
  onlyIntegers,
  defaultTo,
  composeMaskers,
  type ValueMasker,
  type ValueCaster,
} from './processing'
import type { StepFieldName } from '../../form-types'
import type { StepFormContextualState } from '../types'

export type { StepFieldName }

const hydrateLabware = (state: StepFormContextualState, id: string) => {
  const labware = state.labware[id]
  return (
    labware && {
      ...getLabware(labware.type),
      ...labware,
      id,
    }
  )
}
const hydratePipette = (state: StepFormContextualState, id: string) => {
  const pipette = state.pipettes[id]
  return (
    pipette && {
      ...pipette.spec, // TODO: Ian 2018-12-20 don't spread this
      ...pipette,
      id,
    }
  )
}

type StepFieldHelpers = {|
  getErrors?: mixed => Array<string>,
  maskValue?: ValueMasker,
  castValue?: ValueCaster,
  hydrate?: (state: StepFormContextualState, id: string) => mixed,
|}
const stepFieldHelperMap: { [StepFieldName]: StepFieldHelpers } = {
  aspirate_airGap_volume: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  },
  aspirate_labware: {
    getErrors: composeErrors(requiredField),
    hydrate: hydrateLabware,
  },
  aspirate_mix_times: {
    maskValue: composeMaskers(
      maskToNumber,
      onlyPositiveNumbers,
      onlyIntegers,
      defaultTo(1)
    ),
    castValue: Number,
  },
  aspirate_mix_volume: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  },
  aspirate_wells: {
    getErrors: composeErrors(requiredField, minimumWellCount(1)),
    maskValue: defaultTo([]),
  },
  dispense_labware: {
    getErrors: composeErrors(requiredField),
    hydrate: hydrateLabware,
  },
  dispense_mix_times: {
    maskValue: composeMaskers(
      maskToNumber,
      onlyPositiveNumbers,
      onlyIntegers,
      defaultTo(1)
    ),
    castValue: Number,
  },
  dispense_mix_volume: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  },
  dispense_wells: {
    getErrors: composeErrors(requiredField, minimumWellCount(1)),
    maskValue: defaultTo([]),
  },
  disposalVolume_volume: {
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers),
    castValue: Number,
  },
  labware: {
    getErrors: composeErrors(requiredField),
    hydrate: hydrateLabware,
  },
  pauseHour: {
    maskValue: composeMaskers(maskToNumber, onlyPositiveNumbers, onlyIntegers),
  },
  pauseMinute: {
    maskValue: composeMaskers(maskToNumber, onlyPositiveNumbers, onlyIntegers),
  },
  pauseSecond: {
    maskValue: composeMaskers(maskToNumber, onlyPositiveNumbers, onlyIntegers),
  },
  pipette: {
    getErrors: composeErrors(requiredField),
    hydrate: hydratePipette,
  },
  times: {
    getErrors: composeErrors(requiredField),
    maskValue: composeMaskers(
      maskToNumber,
      onlyPositiveNumbers,
      onlyIntegers,
      defaultTo(0)
    ),
    castValue: Number,
  },
  volume: {
    getErrors: composeErrors(requiredField, nonZero),
    maskValue: composeMaskers(maskToFloat, onlyPositiveNumbers, defaultTo(0)),
    castValue: Number,
  },
  wells: {
    getErrors: composeErrors(requiredField, minimumWellCount(1)),
    maskValue: defaultTo([]),
  },
}

export const getFieldErrors = (
  name: StepFieldName,
  value: mixed
): Array<string> => {
  const fieldErrorGetter =
    stepFieldHelperMap[name] && stepFieldHelperMap[name].getErrors
  const errors = fieldErrorGetter ? fieldErrorGetter(value) : []
  return errors
}

export const castField = (name: StepFieldName, value: mixed): mixed => {
  const fieldCaster =
    stepFieldHelperMap[name] && stepFieldHelperMap[name].castValue
  return fieldCaster ? fieldCaster(value) : value
}

export const maskField = (name: StepFieldName, value: mixed): mixed => {
  const fieldMasker =
    stepFieldHelperMap[name] && stepFieldHelperMap[name].maskValue
  return fieldMasker ? fieldMasker(value) : value
}

export const hydrateField = (
  state: StepFormContextualState,
  name: StepFieldName,
  value: string
): mixed => {
  const hydrator = stepFieldHelperMap[name] && stepFieldHelperMap[name].hydrate
  return hydrator ? hydrator(state, value) : value
}
