import { POTENTIAL_TRASH_COMMAND_TYPES } from '../consants'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { RobotState } from '@opentrons/step-generation'

// TODO: the dropTipInPlace, airGapInplace, and
// blowoutInPlace commands don't have
// any knowledge of where its dropping. would be
// nice to expand the results key to include the
// addressable area name
export const getIsPipetteOverTrash = (
  pipettes: RobotState['pipettes'],
  id: string,
  selectedRunTimeCommand?: RunTimeCommand
): boolean =>
  Object.values(pipettes).some(pipette => pipette.entityId === id) &&
  selectedRunTimeCommand != null &&
  POTENTIAL_TRASH_COMMAND_TYPES.includes(selectedRunTimeCommand.commandType)
