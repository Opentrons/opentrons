import findKey from 'lodash/findKey'

import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'

import type { FormData, StepIdType } from '../../../form-types'
import type { ModuleOnDeck } from '../../../step-forms'

export function getNextDefaultTemperatureModuleId(
  savedForms: Record<StepIdType, FormData>,
  orderedStepIds: StepIdType[],
  equippedModulesById: Record<string, ModuleOnDeck>
): string | null {
  return (
    findKey(equippedModulesById, m => m.type === TEMPERATURE_MODULE_TYPE) ||
    null
  )
}
