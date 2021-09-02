import { PickUpTipCommand } from '../LabwarePositionCheck/types'

export const getTipracksVisited = (
  pickupTipCommands: PickUpTipCommand[]
): string[] =>
  pickupTipCommands.reduce<string[]>((visited, command) => {
    const tiprack = command.params.labware
    return visited.includes(tiprack) ? visited : [...visited, tiprack]
  }, [])
