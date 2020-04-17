// @flow
import { i18n } from '../../localization'
import { getDefaultsForStepType } from './getDefaultsForStepType'
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
export function createBlankForm(args: NewFormArgs): FormData {
  const { stepId, stepType } = args
  const baseForm: BlankForm = {
    id: stepId,
    stepType: stepType,
    stepName: i18n.t(`application.stepType.${stepType}`),
    stepDetails: '',
  }

  let additionalFields = {}

  return {
    ...baseForm,
    // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
    ...getDefaultsForStepType(stepType),
    ...additionalFields,
  }
}
