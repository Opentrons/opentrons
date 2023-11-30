import {
  SPAN7_8_10_11_SLOT,
  getModuleDef2,
  getPositionFromSlotId,
} from '@opentrons/shared-data'

import type { RunData } from '@opentrons/api-client'
import type {
  DeckDefinition,
  LabwareDefinition2,
  LabwareDefinitionsByUri,
  ModuleDefinition,
} from '@opentrons/shared-data'

export interface RunModuleInfo {
  moduleId: string
  x: number
  y: number
  moduleDef: ModuleDefinition
  nestedLabwareDef: LabwareDefinition2 | null
  nestedLabwareId: string | null
}

export function getRunModuleRenderInfo(
  runData: RunData,
  deckDef: DeckDefinition,
  labwareDefs: LabwareDefinitionsByUri
): RunModuleInfo[] {
  if (runData.modules.length > 0) {
    return runData.modules.reduce<RunModuleInfo[]>((acc, module) => {
      const moduleDef = getModuleDef2(module.model)
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
