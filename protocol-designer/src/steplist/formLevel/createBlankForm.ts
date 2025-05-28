import { getDefaultsForStepType } from './getDefaultsForStepType'

import type {
  BlankForm,
  FormData,
  StepIdType,
  StepType,
} from '../../form-types'

interface NewFormArgs {
  stepId: StepIdType
  stepType: StepType
}

//  TODO(jr, 1/17/24): add to i18n
const getStepType = (stepType: StepType): string => {
  switch (stepType) {
    case 'absorbanceReader': {
      return 'absorbance plate reader'
    }
    case 'heaterShaker': {
      return 'heater-Shaker state'
    }
    case 'moveLabware': {
      return 'move'
    }
    case 'moveLiquid': {
      return 'transfer'
    }
    case 'magnet': {
      return 'magnetic module state'
    }
    case 'temperature': {
      return 'temperature module state'
    }
    default: {
      return stepType
    }
  }
}

// Add default values to a new step form
export function createBlankForm(args: NewFormArgs): FormData {
  const { stepId, stepType } = args
  const baseForm: BlankForm = {
    id: stepId,
    stepType: stepType,
    stepName: getStepType(stepType),
    stepDetails: '',
  }
  return { ...baseForm, ...getDefaultsForStepType(stepType) }
}
