import {
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'

import type { AddressableAreaName } from '@opentrons/shared-data'

export const isLabwareInDisposalLocation = (slot: string): boolean =>
  slot === GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA ||
  MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(slot as AddressableAreaName) ||
  slot === 'fixedTrash'
