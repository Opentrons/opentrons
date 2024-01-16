import { getDefaultsForStepType } from './getDefaultsForStepType'
import { StepType, StepIdType, BlankForm, FormData } from '../../form-types'
interface NewFormArgs {
  stepId: StepIdType
  stepType: StepType
  t: any
}
// Add default values to a new step form
export function createBlankForm(args: NewFormArgs): FormData {
  const { stepId, stepType, t } = args
  const baseForm: BlankForm = {
    id: stepId,
    stepType: stepType,
    stepName: t(`stepType.${stepType}`),
    stepDetails: '',
  }
  return { ...baseForm, ...getDefaultsForStepType(stepType) }
}
