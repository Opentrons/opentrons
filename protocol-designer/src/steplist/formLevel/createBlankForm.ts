import { i18n } from '../../localization'
import { getDefaultsForStepType } from './getDefaultsForStepType'
import { StepType, StepIdType, BlankForm, FormData } from '../../form-types'
interface NewFormArgs {
  stepId: StepIdType
  stepType: StepType
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
  return { ...baseForm, ...getDefaultsForStepType(stepType) }
}
