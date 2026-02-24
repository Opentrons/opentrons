import type { RunTimeCommand } from '@opentrons/shared-data'

const IN_PLACE_COMMANDS = [
  'aspirateInPlace',
  'blowoutInPlace',
  'dispenseInPlace',
  'airGapInPlace',
] as const

function paramsEstablishWellPosition(
  params: RunTimeCommand['params'],
  labwareId: string
): boolean {
  return (
    'wellLocation' in params &&
    params.wellLocation != null &&
    'labwareId' in params &&
    params.labwareId === labwareId &&
    'wellName' in params &&
    typeof params.wellName === 'string'
  )
}

export function getResolvedWellViewParams(
  commands: RunTimeCommand[],
  currentCommand: RunTimeCommand,
  labwareIdForSlot: string
): RunTimeCommand['params'] {
  const currentIndex = commands.findIndex(c => c.id === currentCommand.id)
  if (currentIndex < 0) return currentCommand.params

  const isInPlace = IN_PLACE_COMMANDS.includes(
    currentCommand.commandType as (typeof IN_PLACE_COMMANDS)[number]
  )
  if (!isInPlace) return currentCommand.params

  // Find the most recent command before this one that set tip position on this labware
  for (let i = currentIndex - 1; i >= 0; i--) {
    const prev = commands[i]
    const params = prev.params
    if (paramsEstablishWellPosition(params, labwareIdForSlot)) {
      const prevParams = params as RunTimeCommand['params'] & {
        wellLocation: unknown
        wellName: string
        labwareId: string
      }
      return {
        ...currentCommand.params,
        wellLocation: prevParams.wellLocation,
        wellName: prevParams.wellName,
        labwareId: prevParams.labwareId,
      }
    }
  }

  return currentCommand.params
}
