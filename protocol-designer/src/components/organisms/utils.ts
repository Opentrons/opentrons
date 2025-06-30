import {
  getAreSlotsVerticallyAdjacent,
  getModuleType,
  MAGNETIC_BLOCK_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { AIR, MODULES_WITH_COLLISION_ISSUES } from '@opentrons/step-generation'

import { ALL_MODULE_SLOTS_OT2 } from '../../modules'
import { DEFAULT_SLOT_MAP_OT2 } from '../../pages/Onboarding/constants'
import { getLabwareIsCompatible } from '../../utils/labwareModuleCompatibility'

import type {
  AddressableArea,
  AddressableAreaName,
  CutoutId,
  DeckDefinition,
  LabwareDefinition2,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'
import type { ContentsByWell } from '../../labware-ingred/types'
import type {
  AllTemporalPropertiesForTimelineFrame,
  ModuleOnDeck,
} from '../../step-forms'
import type * as wellContentsSelectors from '../../top-selectors/well-contents'
import type { CutoutConfigExtended } from './HardwareConfigurator/AddFixtureModal'

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

export const getLabwareNotCompatibleWithModule = (
  moduleType: ModuleType,
  labware: AllTemporalPropertiesForTimelineFrame['labware'],
  cutoutId: CutoutId
): string | null => {
  const slot = cutoutId.split('cutout')[1]
  const isThermocycler = moduleType === THERMOCYCLER_MODULE_TYPE
  const labwareOnSlot = Object.values(labware).find(lw =>
    lw.stack.includes(slot)
  )
  const isLabwareOnOtherTCSlot = isThermocycler
    ? Object.values(labware).some(({ stack }) => stack.includes('A1'))
    : false
  const isCompatible =
    labwareOnSlot != null
      ? getLabwareIsCompatible(labwareOnSlot.def, moduleType)
      : true
  return isCompatible && !isLabwareOnOtherTCSlot ? null : slot
}

export const getSlotHasLabware = (
  labware: AllTemporalPropertiesForTimelineFrame['labware'],
  cutoutId: CutoutId
): boolean => {
  const slot = cutoutId.split('cutout')[1]
  return Object.values(labware).some(lw => lw.stack.includes(slot))
}

export const getLabwareOnSlot = (
  labware: AllTemporalPropertiesForTimelineFrame['labware'],
  cutoutId: CutoutId
): LabwareDefinition2 | null => {
  const slot = cutoutId.split('cutout')[1]
  return Object.values(labware).find(lw => lw.stack.includes(slot))?.def ?? null
}

export const getLabwareCompatibleForEditHardware = (
  labware: AllTemporalPropertiesForTimelineFrame['labware'],
  cutoutId: CutoutId,
  newModule?: CutoutConfigExtended,
  newFixture?: CutoutConfigExtended
): boolean => {
  const labwareDef = getLabwareOnSlot(labware, cutoutId)
  const labwareDefB1 = getLabwareOnSlot(labware, 'cutoutB1')
  const moduleType =
    newModule != null
      ? newModule.type === 'stagingAreaAndMagneticBlock'
        ? MAGNETIC_BLOCK_TYPE
        : getModuleType(newModule.type as ModuleModel)
      : null

  let labwareCompatible = true
  if (moduleType != null && moduleType === THERMOCYCLER_MODULE_TYPE) {
    if (Object.values(labware).some(lw => lw.stack.includes('A1'))) {
      labwareCompatible = false
    } else if (labwareDefB1 != null) {
      labwareCompatible = getLabwareIsCompatible(labwareDefB1, moduleType)
    } else {
      labwareCompatible = true
    }
  } else if (labwareDef != null && moduleType != null) {
    labwareCompatible = getLabwareIsCompatible(labwareDef, moduleType)
  } else if (
    newFixture != null &&
    (newFixture.type === 'wasteChute' || newFixture.type === 'trashBin') &&
    labwareDef != null
  ) {
    labwareCompatible = false
  }
  return labwareCompatible
}

//  NOTE: used to get the next available module slot for OT-2
export const getNextAvailableModuleSlot = (
  moduleModel: ModuleModel,
  moduleOnDeck: ModuleOnDeck[],
  hasThermocycler: boolean
): string | null => {
  const occupiedSlots = moduleOnDeck.map(module => module.slot)
  if (hasThermocycler) {
    occupiedSlots.push('10')
  }
  const defaultSlot = DEFAULT_SLOT_MAP_OT2[getModuleType(moduleModel)]
  if (defaultSlot != null && !occupiedSlots.includes(defaultSlot)) {
    return defaultSlot
  }

  const availableSlots = ALL_MODULE_SLOTS_OT2.filter(
    slot => !occupiedSlots.includes(slot.value)
  )

  if (availableSlots.length > 0) {
    return availableSlots[0].value
  } else {
    return null
  }
}

export const getIsWellContentsEmpty = (
  allWellContentsForActiveItem: wellContentsSelectors.WellContentsByLabware | null,
  labwareId: string
): boolean => {
  const wellContents =
    allWellContentsForActiveItem != null
      ? allWellContentsForActiveItem[labwareId]
      : {}
  return wellContents != null
    ? Object.values(wellContents).every(
        well => Object.keys(well.ingreds).length === 0
      )
    : true
}
