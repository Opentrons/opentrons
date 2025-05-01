import {
  FLEX_ROBOT_TYPE,
  getAreSlotsVerticallyAdjacent,
  getModuleType,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { MODULES_WITH_COLLISION_ISSUES } from '@opentrons/step-generation'

import { ALL_MODULE_SLOTS_OT2 } from '../../modules'
import { DEFAULT_SLOT_MAP_OT2 } from '../../pages/Onboarding/constants'
import { getLabwareIsCompatible } from '../../utils/labwareModuleCompatibility'

import type {
  AddressableArea,
  AddressableAreaName,
  CutoutId,
  DeckDefinition,
  ModuleModel,
  ModuleType,
  RobotType,
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

export const getLabwareNotCompatibleWithModule = (
  moduleType: ModuleType,
  labware: AllTemporalPropertiesForTimelineFrame['labware'],
  cutoutId: CutoutId,
  tcSlot: string
): string | null => {
  const slot = cutoutId.split('cutout')[1]
  const isThermocycler = moduleType === THERMOCYCLER_MODULE_TYPE
  const labwareOnSlot = Object.values(labware).find(lw => lw.slot === slot)
  const isLabwareOnOtherTCSlot = isThermocycler
    ? Object.values(labware).some(({ slot }) => slot === tcSlot)
    : false

  if (isLabwareOnOtherTCSlot) {
    return tcSlot
  } else {
    const isCompatible =
      labwareOnSlot != null
        ? getLabwareIsCompatible(labwareOnSlot.def, moduleType)
        : true
    return isCompatible ? null : slot
  }
}

export const getSlotHasLabware = (
  labware: AllTemporalPropertiesForTimelineFrame['labware'],
  cutoutId: CutoutId
): boolean => {
  const slot = cutoutId.split('cutout')[1]
  return Object.values(labware).some(lw => lw.slot === slot)
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

export const getSlotForLabware = (
  targetLabwareId: string,
  initialDeckSetup: AllTemporalPropertiesForTimelineFrame,
  robotType: RobotType,
  visitedIds: Set<string> = new Set()
): string | null => {
  const flexPattern = /^[A-D][1-4]$/
  const ot2Pattern = /^[1-9]|1[0-2]$/

  if (visitedIds.has(targetLabwareId)) {
    console.error(
      `Circular reference detected while finding physical slot for labware: ${targetLabwareId}`
    )
    return null
  }
  visitedIds.add(targetLabwareId)

  const { labware, modules } = initialDeckSetup

  const labwareInfo = labware[targetLabwareId]
  if (labwareInfo == null) {
    return null
  }
  const location = labwareInfo.slot

  const deckSlotPattern =
    robotType === FLEX_ROBOT_TYPE ? flexPattern : ot2Pattern
  const isSlot = typeof location === 'string' && deckSlotPattern.test(location)

  if (isSlot) {
    return location
  }

  if (typeof location === 'string' && modules[location] != null) {
    const moduleInfo = modules[location]
    const modulePhysicalSlot = moduleInfo.slot
    const isModulePhysicalSlot =
      typeof modulePhysicalSlot === 'string' &&
      deckSlotPattern.test(modulePhysicalSlot)
    if (isModulePhysicalSlot) {
      return modulePhysicalSlot
    } else {
      console.warn(
        `Module ${location} is not placed in a valid physical deck slot: ${modulePhysicalSlot}`
      )
      return null
    }
  }

  if (typeof location === 'string' && labware[location] != null) {
    return getSlotForLabware(location, initialDeckSetup, robotType, visitedIds)
  }
  return null
}
