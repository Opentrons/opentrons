// @flow
import startCase from 'lodash/startCase'
import getDefaultsForStepType from './getDefaultsForStepType'
import type {
  StepType,
  StepIdType,
  BlankForm,
  FormData,
} from '../../form-types'

const FORMS_WITH_PIPETTE = ['transfer', 'mix', 'distribute', 'consolidate']

type NewFormArgs = {
  stepId: StepIdType,
  stepType: StepType,
  defaultNextPipette: string,
}

// Add default values to a new step form
export default function generateNewForm (args: NewFormArgs): FormData {
  const {stepId, stepType, defaultNextPipette} = args
  const baseForm: BlankForm = {
    id: stepId,
    stepType: stepType,
    'step-name': startCase(stepType),
    'step-details': '',
  }

  let additionalFields = {}

  if (FORMS_WITH_PIPETTE.includes(stepType)) {
    additionalFields.pipette = defaultNextPipette
  }

  return {
    ...baseForm,
    ...getDefaultsForStepType(stepType),
    ...additionalFields,
  }
}
