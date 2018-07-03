// @flow
import get from 'lodash/get'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import {selectors as pipetteSelectors} from '../../pipettes'
import {
  requiredField,
  minimumWellCount,
  composeErrors
} from './errors'
import {
  castToNumber,
  onlyPositiveNumbers,
  onlyIntegers,
  defaultTo,
  composeProcessors,
  type valueProcessor
} from './processing'
import type {StepFieldName} from './types'
import type {BaseState} from '../../types'

export type {
  StepFieldName
}

const DEFAULT_CHANGE_TIP_OPTION: 'always' = 'always'

type StepFieldHelpers = {
  getErrors?: (mixed) => Array<string>,
  processValue?: valueProcessor,
  hydrate?: (state: BaseState, id: string) => mixed
}
const StepFieldHelperMap: {[StepFieldName]: StepFieldHelpers} = {
  'aspirate_labware': {
    getErrors: composeErrors(requiredField),
    hydrate: (state, id) => (labwareIngredSelectors.getLabware(state)[id])
  },
  'changeTip': {processValue: defaultTo(DEFAULT_CHANGE_TIP_OPTION)},
  'dispense_delayMinutes': {processValue: composeProcessors(castToNumber, defaultTo(0))},
  'dispense_delaySeconds': {processValue: composeProcessors(castToNumber, defaultTo(0))},
  'dispense_labware': {
    getErrors: composeErrors(requiredField),
    hydrate: (state, id) => (labwareIngredSelectors.getLabware(state)[id])
  },
  'dispense_wells': {getErrors: composeErrors(minimumWellCount(1)), processValue: defaultTo([])},
  'aspirate_disposalVol_volume': {processValue: composeProcessors(castToNumber, onlyPositiveNumbers, onlyIntegers)},
  'labware': {
    getErrors: composeErrors(requiredField),
    hydrate: (state, id) => (labwareIngredSelectors.getLabware(state)[id])
  },
  'pauseHour': {processValue: composeProcessors(castToNumber, onlyPositiveNumbers, onlyIntegers)},
  'pauseMinute': {processValue: composeProcessors(castToNumber, onlyPositiveNumbers, onlyIntegers)},
  'pauseSecond': {processValue: composeProcessors(castToNumber, onlyPositiveNumbers, onlyIntegers)},
  'pipette': {
    getErrors: composeErrors(requiredField),
    hydrate: (state, id) => pipetteSelectors.pipettesById(state)[id]
  },
  'times': {getErrors: composeErrors(requiredField), processValue: composeProcessors(castToNumber, onlyPositiveNumbers, onlyIntegers, defaultTo(0))},
  'volume': {getErrors: composeErrors(requiredField), processValue: composeProcessors(castToNumber, onlyPositiveNumbers, defaultTo(0))},
  'wells': {getErrors: composeErrors(minimumWellCount(1)), processValue: defaultTo([])}
}

export const getFieldErrors = (name: StepFieldName, value: mixed): Array<string> => {
  const fieldErrorGetter: (mixed) => Array<string> = get(StepFieldHelperMap, `${name}.getErrors`)
  const errors: Array<string> = fieldErrorGetter ? fieldErrorGetter(value) : []
  return errors
}

export const processField = (name: StepFieldName, value: mixed): ?mixed => {
  const fieldProcessor = get(StepFieldHelperMap, `${name}.processValue`)
  return fieldProcessor ? fieldProcessor(value) : value
}

export const hydrateField = (state: BaseState, name: StepFieldName, value: mixed): ?mixed => {
  const hydrator = get(StepFieldHelperMap, `${name}.hydrate`)
  return hydrator ? hydrator(state, value) : value
}
