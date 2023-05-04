import { ModuleOnDeck } from '../../../step-forms'
import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import findKey from 'lodash/findKey'

export function getNextDefaultThermocyclerModuleId(
  equippedModulesById: Record<string, ModuleOnDeck>
): string | null {
  return (
    findKey(equippedModulesById, m => m.type === THERMOCYCLER_MODULE_TYPE) ||
    null
  )
}
