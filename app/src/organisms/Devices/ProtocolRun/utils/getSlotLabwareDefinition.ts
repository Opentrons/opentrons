import { LabwareDefinition2, RunTimeCommand } from '@opentrons/shared-data'

export function getSlotLabwareDefinition(
  labwareId: string,
  commands?: RunTimeCommand[]
): LabwareDefinition2 {
  const loadLabwareCommands = commands?.filter(
    command => command.commandType === 'loadLabware'
  )
  const loadLabwareCommand = loadLabwareCommands?.find(
    command => command.result.labwareId === labwareId
  )

  return loadLabwareCommand?.result.definition
}
