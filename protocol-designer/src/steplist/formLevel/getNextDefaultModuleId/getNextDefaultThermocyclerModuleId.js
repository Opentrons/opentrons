// @flow
import findKey from 'lodash/findKey'
import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'

import type { ModuleOnDeck } from '../../../step-forms'
import type { StepIdType, FormData } from '../../../form-types'

export function getNextDefaultThermocyclerModuleId(
  savedForms: { [StepIdType]: FormData },
  orderedStepIds: Array<StepIdType>,
  equippedModulesById: { [moduleId: string]: ModuleOnDeck }
): string | null {
  return (
    findKey(equippedModulesById, m => m.type === THERMOCYCLER_MODULE_TYPE) ||
    null
  )
}
