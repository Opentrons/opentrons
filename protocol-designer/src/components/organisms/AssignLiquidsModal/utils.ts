import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import type { LabwareDefinition } from '@opentrons/shared-data'
import type { FlexStackerModuleState } from '@opentrons/step-generation'
import type { ModuleOnDeck } from '/protocol-designer/step-forms'

export const getStackerModuleStateFromSlot = (args: {
  slot: string
  modules: Record<string, ModuleOnDeck>
}): FlexStackerModuleState | null => {
  const { slot, modules } = args
  const stackerModule =
    Object.values(modules).find(
      ({ slot: moduleSlot, moduleState }) =>
        moduleSlot === slot && moduleState.type === FLEX_STACKER_MODULE_TYPE
    ) ?? null
  return stackerModule != null &&
    stackerModule.moduleState.type === FLEX_STACKER_MODULE_TYPE
    ? stackerModule.moduleState
    : null
}

export const getTopDownPrimaryLabwareInHopper = (args: {
  slot: string
  modules: Record<string, ModuleOnDeck>
}): string[] => {
  const { slot, modules } = args
  const stackerModuleState = getStackerModuleStateFromSlot({ slot, modules })
  const bottomUpLabwareGroups = stackerModuleState?.labwareInHopper ?? []
  return bottomUpLabwareGroups.map(group => group.primaryLabwareId).reverse()
}

export const getStackLimitFromDef = (labwareDef: LabwareDefinition): number =>
  labwareDef.stackLimit ?? 0
