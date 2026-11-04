import {
  COLUMN,
  getPipetteNameSpecs,
  PARTIAL_COLUMN,
  PARTIAL_NOZZLE_MAP,
  QUADRANT,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'

import type {
  ActiveNozzleNumber,
  ConfigureNozzleLayoutRunTimeCommand,
  NozzleConfigurationParams,
  PartialPrimaryNozzles,
  PipetteName,
  RunTimeCommand,
} from '@opentrons/shared-data'

const usedChannelsFromCommand = (
  command: ConfigureNozzleLayoutRunTimeCommand | undefined,
  defaultChannels: ActiveNozzleNumber
): ActiveNozzleNumber => {
  const configurationStyle: NozzleConfigurationParams | undefined =
    command?.params?.configurationParams
  switch (configurationStyle?.style) {
    case COLUMN:
      return 8
    case ROW:
      return 12
    case SINGLE:
      return 1
    case QUADRANT:
    case PARTIAL_COLUMN:
      return configurationStyle?.backLeftNozzle != null
        ? PARTIAL_NOZZLE_MAP[
            configurationStyle?.backLeftNozzle as PartialPrimaryNozzles
          ]
        : defaultChannels

    default:
      return defaultChannels
  }
}

const usedChannelsForPipette = (
  pipetteId: string,
  commands: RunTimeCommand[],
  defaultChannels: ActiveNozzleNumber
): ActiveNozzleNumber =>
  usedChannelsFromCommand(
    commands.findLast(
      (c: RunTimeCommand): c is ConfigureNozzleLayoutRunTimeCommand =>
        c.commandType === 'configureNozzleLayout' &&
        c.params?.pipetteId === pipetteId
    ),
    defaultChannels
  )

const usedChannels = (
  pipetteId: string,
  commands: RunTimeCommand[],
  pipetteChannels: ActiveNozzleNumber
): ActiveNozzleNumber =>
  usedChannelsForPipette(pipetteId, commands, pipetteChannels)

/**
 * @param pipetteName name of pipette being used
 * @param commands list of commands to search within
 * @param wellName the target well for pickup tip
 * @returns WellRange string of wells pipette will pickup tips from
 */
export function getWellRange(
  pipetteId: string,
  commands: RunTimeCommand[],
  wellName: string,
  pipetteName?: PipetteName
): string {
  const pipetteChannels = pipetteName
    ? (getPipetteNameSpecs(pipetteName)?.channels ?? 1)
    : 1

  const channelCount = usedChannels(pipetteId, commands, pipetteChannels)

  if (channelCount === 96) {
    return 'A1 - H12'
  } else if (channelCount === 8) {
    const column = wellName.substring(1)
    return `A${column} - H${column}`
  } else if (channelCount === 12) {
    const row = wellName.charAt(0)
    return `${row}1 - ${row}12`
  } else if (channelCount >= 2 && channelCount <= 7) {
    const column = wellName.substring(1)
    const endRow = String.fromCharCode(64 + channelCount)
    return `A${column} - ${endRow}${column}`
  } else {
    return wellName
  }
}
