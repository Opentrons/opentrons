import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'
import findKey from 'lodash/findKey'

import { StepIdType, FormData } from '../../../form-types'
import { ModuleOnDeck } from '../../../step-forms'

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
