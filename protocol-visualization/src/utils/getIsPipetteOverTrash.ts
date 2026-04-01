import { POTENTIAL_TRASH_COMMAND_TYPES } from '../consants'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { RobotState } from '@opentrons/step-generation'

export const getIsPipetteOverTrash = (
  pipettes: RobotState['pipettes'],
  id: string,
  selectedRunTimeCommand?: RunTimeCommand
): boolean =>
  Object.values(pipettes).some(pipette => pipette.entityId === id) &&
  selectedRunTimeCommand != null &&
  POTENTIAL_TRASH_COMMAND_TYPES.includes(selectedRunTimeCommand.commandType)
