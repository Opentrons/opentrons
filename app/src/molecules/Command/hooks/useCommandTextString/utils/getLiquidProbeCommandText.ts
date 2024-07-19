import type {
  LiquidProbeRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { HandlesCommands } from './types'
import {
  getFinalLabwareLocation,
  getLabwareDisplayLocation,
  getLabwareName,
} from '../../../utils'
import type { TFunction } from 'i18next'

export function getLiquidProbeCommandText({
  command,
  commandTextData,
  t,
  robotType,
}: HandlesCommands<LiquidProbeRunTimeCommand>): string {
  const { wellName, labwareId } = command.params

  const allPreviousCommands = commandTextData?.commands.slice(
    0,
    commandTextData.commands.findIndex(c => c.id === command?.id)
  )

  const labwareLocation =
    allPreviousCommands != null
      ? getFinalLabwareLocation(
          labwareId,
          allPreviousCommands as RunTimeCommand[]
        )
      : null

  const displayLocation =
    labwareLocation != null && commandTextData != null
      ? getLabwareDisplayLocation(
          commandTextData,
          labwareLocation,
          t as TFunction,
          robotType
        )
      : ''

  const labware =
    commandTextData != null ? getLabwareName(commandTextData, labwareId) : null

  return t('detect_liquid_presence', {
    labware,
    labware_location: displayLocation,
    well_name: wellName,
  })
}
