import {
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'

import type { AddressableAreaName } from '@opentrons/shared-data'

/**
 * True when the stack slot is a waste chute or trash destination.
 * Those addressable areas still resolve to non-null deck coordinates
 * (`gripperWasteChute` maps onto cutout D3), so deck renderers must filter
 * them before calling `getPositionFromSlotId`.
 */
export const isLabwareInDisposalLocation = (slot: string): boolean =>
  slot === GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA ||
  MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(slot as AddressableAreaName) ||
  slot === 'fixedTrash'
