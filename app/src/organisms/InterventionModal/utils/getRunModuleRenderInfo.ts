import {
  getModuleDef,
  getPositionFromSlotId,
  SPAN7_8_10_11_SLOT,
} from '@opentrons/shared-data'

import type { RunData } from '@opentrons/api-client'
import type {
  DeckDefinition,
  LabwareDefinition,
  LabwareDefinitionsByUri,
  ModuleDefinition,
} from '@opentrons/shared-data'

export interface RunModuleInfo {
  moduleId: string
  x: number
  y: number
  moduleDef: ModuleDefinition
  nestedLabwareDef: LabwareDefinition | null
  nestedLabwareId: string | null
}

export function getRunModuleRenderInfo(
  runData: RunData,
  deckDef: DeckDefinition,
  labwareDefs: LabwareDefinitionsByUri
): RunModuleInfo[] {
  if (runData.modules.length > 0) {
    return runData.modules.reduce<RunModuleInfo[]>((acc, module) => {
      const moduleDef = getModuleDef(module.model)
      const nestedLabware = runData.labware.find(
        labware =>
          typeof labware.location === 'object' &&
          'moduleId' in labware.location &&
          labware.location.moduleId === module.id
      )
      const nestedLabwareDef =
        nestedLabware != null ? labwareDefs[nestedLabware?.definitionUri] : null
      let slotName = module.location.slotName
      if (slotName === SPAN7_8_10_11_SLOT) {
        slotName = '7'
      }
      const slotPosition = getPositionFromSlotId(slotName, deckDef)

      return [
        ...acc,
        {
          moduleId: module.id,
          x: slotPosition?.[0] ?? 0,
          y: slotPosition?.[1] ?? 0,
          moduleDef,
          nestedLabwareDef,
          nestedLabwareId: nestedLabware?.id ?? null,
        },
      ]
    }, [])
  }
  return []
}
