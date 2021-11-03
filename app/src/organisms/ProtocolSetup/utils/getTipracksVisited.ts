import { PickUpTipCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'

export const getTipracksVisited = (
  pickupTipCommands: PickUpTipCommand[]
): string[] =>
  pickupTipCommands.reduce<string[]>((visited, command) => {
    const tiprack = command.params.labwareId
    return visited.includes(tiprack) ? visited : [...visited, tiprack]
  }, [])
