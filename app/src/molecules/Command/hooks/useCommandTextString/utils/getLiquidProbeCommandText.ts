import {
  getFinalLabwareLocation,
  getLabwareDisplayLocation,
  getLabwareName,
} from '../../../utils'

import type {
  LiquidProbeRunTimeCommand,
  RunTimeCommand,
  TryLiquidProbeRunTimeCommand,
} from '@opentrons/shared-data'
import type { HandlesCommands } from './types'
import type { TFunction } from 'i18next'

type LiquidProbeRunTimeCommands =
  | LiquidProbeRunTimeCommand
  | TryLiquidProbeRunTimeCommand

export function getLiquidProbeCommandText({
  command,
  allRunDefs,
  commandTextData,
  t,
  robotType,
}: HandlesCommands<LiquidProbeRunTimeCommands>): string {
  const { wellName, labwareId } = command.params

  const allPreviousCommands = commandTextData?.commands.slice(
    0,
    commandTextData.commands.findIndex(c => c.id === command?.id)
  )

  const labwareLocation =
    allPreviousCommands != null
      ? getFinalLabwareLocation(
          labwareId as string,
          allPreviousCommands as RunTimeCommand[]
        )
      : null

  const displayLocation =
    labwareLocation != null && commandTextData != null
      ? getLabwareDisplayLocation(
          commandTextData,
          allRunDefs,
          labwareLocation,
          t as TFunction,
          robotType
        )
      : ''

  const labware =
    commandTextData != null
      ? getLabwareName(commandTextData, labwareId as string)
      : null

  return t('detect_liquid_presence', {
    labware,
    labware_location: displayLocation,
    well_name: wellName,
  })
}
