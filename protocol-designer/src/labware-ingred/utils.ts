import {
  FIXED_TRASH_ID,
  getDeckDefFromRobotType,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'
import { COLUMN_4_SLOTS } from '@opentrons/step-generation'
import { getSlotIsEmpty } from '../step-forms/utils'
import { getStagingAreaAddressableAreas } from '../utils'
import type { RobotType, CutoutId } from '@opentrons/shared-data'
import type { InitialDeckSetup } from '../step-forms/types'
import type { DeckSlot } from '../types'

export function getNextAvailableDeckSlot(
  initialDeckSetup: InitialDeckSetup,
  robotType: RobotType
): DeckSlot | null | undefined {
  const deckDef = getDeckDefFromRobotType(robotType)

  return deckDef.locations.addressableAreas.find(slot => {
    const cutoutIds = Object.values(initialDeckSetup.additionalEquipmentOnDeck)
      .filter(ae => ae.name === 'stagingArea')
      .map(ae => ae.location as CutoutId)
    const stagingAreaAddressableAreaNames = getStagingAreaAddressableAreas(
      cutoutIds
    )
    const addressableAreaName = stagingAreaAddressableAreaNames.find(
      aa => aa === slot?.id
    )
    let isSlotEmpty: boolean = getSlotIsEmpty(initialDeckSetup, slot.id)
    if (addressableAreaName == null && COLUMN_4_SLOTS.includes(slot.id)) {
      isSlotEmpty = false
    }
    if (
      MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(slot.id) ||
      WASTE_CHUTE_ADDRESSABLE_AREAS.includes(slot.id) ||
      slot.id === FIXED_TRASH_ID
    ) {
      isSlotEmpty = false
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
