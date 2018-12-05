// @flow
import startCase from 'lodash/startCase'
import getDefaultsForStepType from './getDefaultsForStepType'
import type {
  StepType,
  StepIdType,
  BlankForm,
  FormData,
} from '../../form-types'

type NewFormArgs = {
  stepId: StepIdType,
  stepType: StepType,
}

// Add default values to a new step form
export default function generateNewForm (args: NewFormArgs): FormData {
  const {stepId, stepType} = args
  const baseForm: BlankForm = {
    id: stepId,
    stepType: stepType,
    'step-name': startCase(stepType),
    'step-details': '',
  }

  let additionalFields = {}

  return {
    ...baseForm,
    ...getDefaultsForStepType(stepType),
    ...additionalFields,
  }
}
