// @flow
import findKey from 'lodash/findKey'
import last from 'lodash/last'
import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'

import type { ModuleOnDeck } from '../../../step-forms'
import type { StepIdType, FormData } from '../../../form-types'

const isLastStepTemp = (lastModuleStep: FormData = {}): boolean =>
  !!(lastModuleStep.moduleId && lastModuleStep.stepType === 'temperature')

export function getNextDefaultThermocyclerModuleId(
  savedForms: { [StepIdType]: FormData },
  orderedStepIds: Array<StepIdType>,
  equippedModulesById: { [moduleId: string]: ModuleOnDeck }
): string | null {
  const prevModuleSteps = orderedStepIds
    .map(stepId => savedForms[stepId])
    .filter(form => form && form.moduleId)

  const lastModuleStep = last(prevModuleSteps)

  const nextDefaultModule: string | null =
    (isLastStepTemp(lastModuleStep) && lastModuleStep.moduleId) ||
    findKey(equippedModulesById, m => m.type === THERMOCYCLER_MODULE_TYPE) ||
    null

  return nextDefaultModule || null
}
