import { MODULES_WITH_COLLISION_ISSUES } from '@opentrons/step-generation'
import { getAreSlotsVerticallyAdjacent } from '@opentrons/shared-data'
import { COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE } from '../../utils/labwareModuleCompatibility'
import type {
  AddressableArea,
  AddressableAreaName,
  CutoutId,
  DeckDefinition,
  ModuleType,
} from '@opentrons/shared-data'
import type {
  AllTemporalPropertiesForTimelineFrame,
  ModuleOnDeck,
} from '../../step-forms'

export const getSlotsWithCollisions = (
  deckDef: DeckDefinition,
  allModules: ModuleOnDeck[]
): AddressableAreaName[] => {
  return deckDef.locations.addressableAreas.reduce(
    (acc: AddressableAreaName[], aa: AddressableArea) => {
      const modulesWithCollisionsOnDeck = allModules.filter(module =>
        MODULES_WITH_COLLISION_ISSUES.includes(module.model)
      )
      if (modulesWithCollisionsOnDeck.length === 0) {
        return acc
      }

      const hasCollision = modulesWithCollisionsOnDeck.some(module =>
        getAreSlotsVerticallyAdjacent(module.slot, aa.id)
      )
      if (hasCollision) {
        return [...acc, aa.id]
      }
      return acc
    },
    []
  )
}

export const getIsLabwareCompatibleWithModule = (
  moduleType: ModuleType,
  labware: AllTemporalPropertiesForTimelineFrame['labware'],
  cutoutId: CutoutId
): boolean => {
  const slot = cutoutId.split('cutout')[1]
  const labwareOnSlot = Object.values(labware).find(lw => lw.slot === slot)
  return labwareOnSlot != null
    ? COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE[moduleType].includes(
        labwareOnSlot.def.parameters.loadName
      )
    : true
}
