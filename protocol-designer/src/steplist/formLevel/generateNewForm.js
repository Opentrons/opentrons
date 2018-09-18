// @flow
import startCase from 'lodash/startCase'
import getDefaultsForStepType from './getDefaultsForStepType'
import type {
  StepType,
  StepIdType,
  BlankForm,
  FormData,
} from '../../form-types'

export default function generateNewForm (stepId: StepIdType, stepType: StepType): FormData {
  // Add default values to a new step form
  const baseForm: BlankForm = {
    id: stepId,
    stepType: stepType,
    'step-name': startCase(stepType),
    'step-details': '',
  }
  return {...baseForm, ...getDefaultsForStepType(stepType)}
}
