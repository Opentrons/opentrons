import { LEFT, RIGHT } from '@opentrons/shared-data'
import type { AttachedPipettesByMount } from '@opentrons/api-client'

export function getIsGantryEmpty(
  attachedPipette: AttachedPipettesByMount
): boolean {
  return attachedPipette[LEFT] == null && attachedPipette[RIGHT] == null
}
