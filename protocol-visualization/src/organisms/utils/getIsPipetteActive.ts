import type { PipetteMount, RunTimeCommand } from '@opentrons/shared-data'
import type { RobotState } from '@opentrons/step-generation'

export const getIsPipetteActive = (
  side: PipetteMount,
  pipettes: RobotState['pipettes'],
  currentCommand: RunTimeCommand
): boolean => {
  const pipetteId =
    Object.entries(pipettes ?? {}).find(
      ([_, pipette]) => pipette.mount === side
    )?.[0] ?? null

  return (
    'pipetteId' in currentCommand.params &&
    currentCommand.params.pipetteId === pipetteId &&
    pipetteId != null
  )
}
