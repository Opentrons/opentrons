import { GEN_ONE_MULTI_PIPETTES } from '@opentrons/shared-data'
import {
  getLabwareIsCompatible,
  getLabwareIsCustom,
} from '../../utils/labwareModuleCompatibility'
import type { InitialDeckSetup, LabwareOnDeck } from '../../step-forms'
import type { ModuleType } from '@opentrons/shared-data'
import type { LabwareDefByDefURI } from '../../labware-defs'

export interface SwapBlockedArgs {
  hoveredLabware?: LabwareOnDeck | null
  draggedLabware?: LabwareOnDeck | null
  modulesById: InitialDeckSetup['modules']
  customLabwareDefs: LabwareDefByDefURI
}

export const getSwapBlocked = (args: SwapBlockedArgs): boolean => {
  const {
    hoveredLabware,
    draggedLabware,
    modulesById,
    customLabwareDefs,
  } = args
  if (!hoveredLabware || !draggedLabware) {
    return false
  }

  const sourceModuleType: ModuleType | null =
    modulesById[draggedLabware.slot]?.type || null
  const destModuleType: ModuleType | null =
    modulesById[hoveredLabware.slot]?.type || null

  const draggedLabwareIsCustom = getLabwareIsCustom(
    customLabwareDefs,
    draggedLabware
  )
  const hoveredLabwareIsCustom = getLabwareIsCustom(
    customLabwareDefs,
    hoveredLabware
  )

  // dragging custom labware to module gives not compat error
  const labwareSourceToDestBlocked = sourceModuleType
    ? !getLabwareIsCompatible(hoveredLabware.def, sourceModuleType) &&
      !hoveredLabwareIsCustom
    : false
  const labwareDestToSourceBlocked = destModuleType
    ? !getLabwareIsCompatible(draggedLabware.def, destModuleType) &&
      !draggedLabwareIsCustom
    : false

  return labwareSourceToDestBlocked || labwareDestToSourceBlocked
}

export const getHasGen1MultiChannelPipette = (
  pipettes: InitialDeckSetup['pipettes']
): boolean => {
  const pipetteIds = Object.keys(pipettes)
  return pipetteIds.some(pipetteId =>
    GEN_ONE_MULTI_PIPETTES.includes(pipettes[pipetteId]?.name)
  )
}
