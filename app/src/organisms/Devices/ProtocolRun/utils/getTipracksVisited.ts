import type { PickUpTipRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/pipetting'

export const getTipracksVisited = (
  pickupTipCommands: PickUpTipRunTimeCommand[]
): string[] =>
  pickupTipCommands.reduce<string[]>((visited, command) => {
    const tiprack = command.params.labwareId
    return visited.includes(tiprack) ? visited : [...visited, tiprack]
  }, [])
