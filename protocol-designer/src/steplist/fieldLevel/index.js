// @flow
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
  type ValueProcessor
} from './processing'
import type {StepFieldName} from './types'
import type {BaseState} from '../../types'

export type {
  StepFieldName
}

const DEFAULT_CHANGE_TIP_OPTION: 'always' = 'always'

const hydrateLabware = (state, id) => (labwareIngredSelectors.getLabware(state)[id])

type StepFieldHelpers = {
  getErrors?: (mixed) => Array<string>,
  processValue?: ValueProcessor,
  hydrate?: (state: BaseState, id: string) => mixed
}
const stepFieldHelperMap: {[StepFieldName]: StepFieldHelpers} = {
  'aspirate_labware': {
    getErrors: composeErrors(requiredField),
    hydrate: hydrateLabware
  },
  'changeTip': {
    processValue: defaultTo(DEFAULT_CHANGE_TIP_OPTION)
  },
  'dispense_delayMinutes': {
    processValue: composeProcessors(castToNumber, defaultTo(0))
  },
  'dispense_delaySeconds': {
    processValue: composeProcessors(castToNumber, defaultTo(0))
  },
  'dispense_labware': {
    getErrors: composeErrors(requiredField),
    hydrate: hydrateLabware
  },
  'dispense_wells': {
    getErrors: composeErrors(minimumWellCount(1)),
    processValue: defaultTo([])
  },
  'aspirate_disposalVol_volume': {
    processValue: composeProcessors(castToNumber, onlyPositiveNumbers, onlyIntegers)
  },
  'labware': {
    getErrors: composeErrors(requiredField),
    hydrate: hydrateLabware
  },
  'pauseHour': {
    processValue: composeProcessors(castToNumber, onlyPositiveNumbers, onlyIntegers)
  },
  'pauseMinute': {
    processValue: composeProcessors(castToNumber, onlyPositiveNumbers, onlyIntegers)
  },
  'pauseSecond': {
    processValue: composeProcessors(castToNumber, onlyPositiveNumbers, onlyIntegers)
  },
  'pipette': {
    getErrors: composeErrors(requiredField),
    hydrate: (state, id) => pipetteSelectors.pipettesById(state)[id]
  },
  'times': {
    getErrors: composeErrors(requiredField),
    processValue: composeProcessors(castToNumber, onlyPositiveNumbers, onlyIntegers, defaultTo(0))
  },
  'volume': {
    getErrors: composeErrors(requiredField),
    processValue: composeProcessors(castToNumber, onlyPositiveNumbers, defaultTo(0))
  },
  'wells': {
    getErrors: composeErrors(minimumWellCount(1)),
    processValue: defaultTo([])
  }
}

export const getFieldErrors = (name: StepFieldName, value: mixed): Array<string> => {
  const fieldErrorGetter = stepFieldHelperMap[name] && stepFieldHelperMap[name].getErrors
  const errors = fieldErrorGetter ? fieldErrorGetter(value) : []
  return errors
}

export const processField = (name: StepFieldName, value: mixed): ?mixed => {
  const fieldProcessor = stepFieldHelperMap[name] && stepFieldHelperMap[name].processValue
  return fieldProcessor ? fieldProcessor(value) : value
}

export const hydrateField = (state: BaseState, name: StepFieldName, value: string): ?mixed => {
  const hydrator = stepFieldHelperMap[name] && stepFieldHelperMap[name].hydrate
  return hydrator ? hydrator(state, value) : value
}
