import { RobotType, getDeckDefFromRobotType } from '@opentrons/shared-data'
import { getSlotIsEmpty } from '../step-forms/utils'
import { InitialDeckSetup } from '../step-forms/types'
import { DeckSlot } from '../types'

export function getNextAvailableDeckSlot(
  initialDeckSetup: InitialDeckSetup,
  robotType: RobotType
): DeckSlot | null | undefined {
  const deckDef = getDeckDefFromRobotType(robotType)
  return deckDef.locations.addressableAreas.find(slot =>
    getSlotIsEmpty(initialDeckSetup, slot.id)
  )?.id
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
