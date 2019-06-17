// @flow
import type { DeckSlotId } from '@opentrons/shared-data'
import { sortedSlotnames } from '@opentrons/components'

export function getNextAvailableSlot(labwareLocations: {
  [labwareId: string]: DeckSlotId,
}): ?DeckSlotId {
  const filledLocations = Object.values(labwareLocations)
  return sortedSlotnames.find(
    slot => !filledLocations.some(filledSlot => filledSlot === slot)
  )
}

const nameOnlyPattern = /^(.*)\(\d+\)$/
const numOnlyPattern = /^.*\((\d+)\)$/
export function getNextNickname(
  allNicknames: Array<string>,
  _proposedNickname: string
): string {
  const proposedNickname = _proposedNickname.trim()
  const parsed = allNicknames.reduce((acc, nickname) => {
    const nameOnly = (
      (nameOnlyPattern.exec(nickname) || [])[1] || nickname
    ).trim()
    const numOnlyMatch = numOnlyPattern.exec(nickname)
    // if no number, use zero
    const num = numOnlyMatch ? Number(numOnlyMatch[1]) : 0
    if (nameOnly === proposedNickname) {
      return [...acc, { nameOnly, num }]
    }
    return acc
  }, [])

  const topMatchNum = Math.max(...parsed.map(({ num }) => num))
  return Number.isFinite(topMatchNum)
    ? `${proposedNickname.trim()} (${topMatchNum + 1})`
    : proposedNickname
}
