import {
  FIXED_TRASH_ID,
  FLEX_MODULE_ADDRESSABLE_AREAS,
  FLEX_STACKER_ADDRESSABLE_AREAS,
  getAreSlotsAdjacent,
  getDeckDefFromRobotType,
  getIsLabwareAboveHeight,
  HEATERSHAKER_MODULE_TYPE,
  MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'
import { COLUMN_4_SLOTS } from '@opentrons/step-generation'

import { getSlotIsEmpty } from '../step-forms/utils'
import { getStagingAreaAddressableAreas } from '../utils'

import type {
  CutoutId,
  LabwareDefinition2,
  RobotType,
} from '@opentrons/shared-data'
import type { Labware } from '../file-types'
import type { LabwareDefByDefURI } from '../labware-defs'
import type { InitialDeckSetup } from '../step-forms/types'
import type { DeckSlot } from '../types'

export function getNextAvailableDeckSlot(
  initialDeckSetup: InitialDeckSetup,
  robotType: RobotType,
  labwareDefinition?: LabwareDefinition2
): DeckSlot | null | undefined {
  const deckDef = getDeckDefFromRobotType(robotType)
  const heaterShakerSlot = Object.values(initialDeckSetup.modules).find(
    module => module.type === HEATERSHAKER_MODULE_TYPE
  )?.slot

  const hasTC = Object.values(initialDeckSetup.modules).find(
    module => module.type === THERMOCYCLER_MODULE_TYPE
  )
  let moduleSlots = Object.values(initialDeckSetup.modules)
    .filter(module => module.slot)
    .map(mod => mod.slot)
  if (hasTC) {
    //  encompass all TC slots for both robots since they're different
    moduleSlots = [...moduleSlots, '8', '10', '11', 'A1']
  }

  return deckDef.locations.addressableAreas.find(slot => {
    const cutoutIds = Object.values(initialDeckSetup.additionalEquipmentOnDeck)
      .filter(ae => ae.name === 'stagingArea')
      .map(ae => ae.location as CutoutId)
    const stagingAreaAddressableAreaNames =
      getStagingAreaAddressableAreas(cutoutIds)
    const addressableAreaName = stagingAreaAddressableAreaNames.find(
      aa => aa === slot.id
    )
    let isSlotEmpty: boolean = getSlotIsEmpty(initialDeckSetup, slot.id, true)
    if (addressableAreaName == null && COLUMN_4_SLOTS.includes(slot.id)) {
      isSlotEmpty = false
    } else if (
      MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(slot.id) ||
      WASTE_CHUTE_ADDRESSABLE_AREAS.includes(slot.id) ||
      slot.id === FIXED_TRASH_ID
    ) {
      isSlotEmpty = false
    } else if (
      moduleSlots.includes(slot.id) ||
      FLEX_MODULE_ADDRESSABLE_AREAS.includes(slot.id) ||
      FLEX_STACKER_ADDRESSABLE_AREAS.includes(slot.id)
    ) {
      isSlotEmpty = false
      //  return slot as full if slot is adjacent to heater-shaker for ot-2 and taller than 53mm
    } else if (
      heaterShakerSlot != null &&
      robotType === OT2_ROBOT_TYPE &&
      isSlotEmpty &&
      labwareDefinition != null
    ) {
      isSlotEmpty =
        !getAreSlotsAdjacent(heaterShakerSlot, slot.id) ||
        !(
          getAreSlotsAdjacent(heaterShakerSlot, slot.id) &&
          getIsLabwareAboveHeight(
            labwareDefinition,
            MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM
          )
        )
    }
    return isSlotEmpty
  })?.id
}

const getMatchOrNull = (
  pattern: RegExp,
  s: string
): string | null | undefined => {
  const matchResult = pattern.exec(s)
  return matchResult ? matchResult[1] : null
}

const nameOnlyPattern = /^(.*)\(\d+\)$/
const numOnlyPattern = /^.*\((\d+)\)$/
export function getNextNickname(
  allNicknames: string[],
  _proposedNickname: string
): string {
  const proposedNickname = (
    getMatchOrNull(nameOnlyPattern, _proposedNickname) || _proposedNickname
  ).trim()

  const matchingDisambigNums = allNicknames.reduce<number[]>(
    (acc, nickname) => {
      const nameOnly = (
        getMatchOrNull(nameOnlyPattern, nickname) || nickname
      ).trim()
      const numOnlyMatch = getMatchOrNull(numOnlyPattern, nickname)
      const num = numOnlyMatch ? Number(numOnlyMatch) : 0

      // only include matching names
      if (nameOnly === proposedNickname) {
        return [...acc, num]
      }

      return acc
    },
    []
  )
  const topMatchNum = Math.max(...matchingDisambigNums)
  return Number.isFinite(topMatchNum)
    ? `${proposedNickname.trim()} (${topMatchNum + 1})`
    : proposedNickname
}

// Additional equipment types that are not stored in the labware object
// and should not be migrated
const ADDITIONAL_EQUIPMENT_TYPES = ['wasteChute', 'trashBin']

export const getMigratedLabwareId = (
  // labware or trash-like entity ID
  oldEntityId: string | null,
  labware: Labware,
  allLabwareDefs: Record<string, LabwareDefinition2>,
  latestDefs: LabwareDefByDefURI
): string | null => {
  if (oldEntityId == null) {
    return null
  }
  // Check if this is an additional equipment ID (e.g., waste chute, trash bin)
  // These are stored in additionalEquipmentOnDeck, not in labware, so return unchanged
  const isAdditionalEquipment = ADDITIONAL_EQUIPMENT_TYPES.some(type =>
    oldEntityId.includes(type)
  )
  if (isAdditionalEquipment) {
    return oldEntityId
  }

  const defURI = labware[oldEntityId]?.labwareDefURI
  const loadName = allLabwareDefs[defURI]?.parameters.loadName
  const latestURI = Object.entries(latestDefs).find(
    ([_, def]) => def.parameters.loadName === loadName
  )?.[0]

  if (defURI == null) {
    console.error(
      `expected to find a matching defURI with labwareId ${oldEntityId} but could not`
    )
  }

  const labwareIdString = oldEntityId.split(':')[0]
  const latestLabwareId =
    latestURI != null
      ? `${labwareIdString}:${latestURI}`
      : `${labwareIdString}:${defURI}` // fallback to original labwareId & defURI for custom labware

  return latestLabwareId
}

export const getMigratedURI = (
  oldURI: string,
  allLabwareDefs: Record<string, LabwareDefinition2>,
  latestDefs: LabwareDefByDefURI
): string => {
  const loadName = allLabwareDefs[oldURI]?.parameters.loadName
  const latestURI = Object.entries(latestDefs).find(
    ([_, def]) => def.parameters.loadName === loadName
  )?.[0]
  return latestURI ?? oldURI // fallback to oldURI for custom labware
}
