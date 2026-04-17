import { getPipetteNameSpecs } from '@opentrons/shared-data'

import type {
  ConfigureNozzleLayoutRunTimeCommand,
  PipetteName,
  RunTimeCommand,
} from '@opentrons/shared-data'

const usedChannelsFromCommand = (
  command: ConfigureNozzleLayoutRunTimeCommand | undefined,
  defaultChannels: number
): number => {
  const style = command?.params?.configurationParams?.style
  if (style === 'SINGLE') {
    return 1
  }
  if (style === 'COLUMN') {
    return 8
  }
  return defaultChannels
}

const usedChannelsForPipette = (
  pipetteId: string,
  commands: RunTimeCommand[],
  defaultChannels: number
): number =>
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
  pipetteChannels: number
): number =>
  pipetteChannels === 96
    ? usedChannelsForPipette(pipetteId, commands, pipetteChannels)
    : pipetteChannels

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
  }
  return wellName
}
