import type { LabwareLocation, RunTimeCommand } from '@opentrons/shared-data'

/**
 * given a list of commands and a labwareId, calculate the resulting location
 * of the corresponding labware after all given commands are executed
 * @param labwareId target labware
 * @param commands list of commands to search within
 * @returns LabwareLocation object of the resulting location of the target labware after all commands execute
 */
export function getFinalLabwareLocation(
  labwareId: string,
  commands: RunTimeCommand[]
): LabwareLocation | null {
  return commands.reduce<LabwareLocation | null>((acc, c) => {
    if (c.commandType === 'loadLabware' && c.result?.labwareId === labwareId) {
      return c.params.location
    } else if (
      c.commandType === 'moveLabware' &&
      c.params.labwareId === labwareId
    ) {
      return c.params.newLocation
    } else {
      return acc
    }
  }, null)
}
