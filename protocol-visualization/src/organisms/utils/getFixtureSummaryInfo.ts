import { getIsPipetteOverTrash } from './getIsPipetteOverTrash'

import type { CutoutId, RunTimeCommand } from '@opentrons/shared-data'
import type {
  RobotState,
  TrashBinEntities,
  WasteChuteEntities,
} from '@opentrons/step-generation'

export const getFixtureSummaryInfo = (
  pipettes: RobotState['pipettes'],
  entities: TrashBinEntities | WasteChuteEntities,
  selectedRunTimeCommand?: RunTimeCommand
): {
  isPipetteOverTrash: boolean
  trashLikeEntityCutoutId: CutoutId | null
} => {
  const pipetteCurrentTrashId = Object.values(pipettes).find(
    pipette => pipette.entityId != null && entities[pipette.entityId] != null
  )?.entityId
  const isPipetteOverTrash =
    pipetteCurrentTrashId != null
      ? getIsPipetteOverTrash(
          pipettes,
          pipetteCurrentTrashId,
          selectedRunTimeCommand
        )
      : false
  const trashLikeEntityCutoutId =
    pipetteCurrentTrashId != null
      ? (entities[pipetteCurrentTrashId].location as CutoutId)
      : null

  return { isPipetteOverTrash, trashLikeEntityCutoutId }
}
