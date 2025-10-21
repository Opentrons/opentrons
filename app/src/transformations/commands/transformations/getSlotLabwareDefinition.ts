import type { LabwareDefinition, RunTimeCommand } from '@opentrons/shared-data'

export function getSlotLabwareDefinition(
  labwareId: string,
  commands?: RunTimeCommand[]
): LabwareDefinition {
  const loadLabwareCommands = commands?.filter(
    command => command.commandType === 'loadLabware'
  )
  const loadLabwareCommand = loadLabwareCommands?.find(
    command => command.result?.labwareId === labwareId
  )

  return loadLabwareCommand?.result?.definition
}
