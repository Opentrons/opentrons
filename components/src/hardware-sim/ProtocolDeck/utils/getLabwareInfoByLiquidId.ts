import reduce from 'lodash/reduce'
import type {
  LoadLiquidRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { LabwareByLiquidId } from '../types'

export function getLabwareInfoByLiquidId(
  commands: RunTimeCommand[]
): LabwareByLiquidId {
  const loadLiquidCommands =
    commands.length !== 0
      ? commands.filter(
          (command): command is LoadLiquidRunTimeCommand =>
            command.commandType === 'loadLiquid'
        )
      : []

  return reduce<LoadLiquidRunTimeCommand, LabwareByLiquidId>(
    loadLiquidCommands,
    (acc, command) => {
      if (!(command.params.liquidId in acc)) {
        acc[command.params.liquidId] = []
      }
      const labwareId = command.params.labwareId
      const volumeByWell = command.params.volumeByWell
      const labwareIndex = acc[command.params.liquidId].findIndex(
        i => i.labwareId === labwareId
      )
      if (labwareIndex >= 0) {
        acc[command.params.liquidId][labwareIndex].volumeByWell = {
          ...acc[command.params.liquidId][labwareIndex].volumeByWell,
          ...volumeByWell,
        }
      } else {
        acc[command.params.liquidId].push({ labwareId, volumeByWell })
      }
      return acc
    },
    {}
  )
}
