// @flow
import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'
import findKey from 'lodash/findKey'

import type { FormData, StepIdType } from '../../../form-types'
import type { ModuleOnDeck } from '../../../step-forms'

export function getNextDefaultTemperatureModuleId(
  savedForms: { [StepIdType]: FormData },
  orderedStepIds: Array<StepIdType>,
  equippedModulesById: { [moduleId: string]: ModuleOnDeck }
): string | null {
  return (
    findKey(equippedModulesById, m => m.type === TEMPERATURE_MODULE_TYPE) ||
    null
  )
}
