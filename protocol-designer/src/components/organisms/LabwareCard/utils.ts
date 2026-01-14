import { getIsLid } from '@opentrons/shared-data'

import type { LabwareDefinition } from '@opentrons/shared-data'

/**
 * Returns whether the quantity of the specified labware can be modified.
 *
 * Quantity can be modified if the labware is a lid (as determined by its definition),
 * or if the labware is placed on the hopper.
 * In the future, we will allow stacking certain labware directly on the deck
 *
 * @param labwareDef - The labware definition.
 * @param isOnHopper - True if the labware is on the hopper, otherwise false.
 * @returns True if the labware quantity can be modified, otherwise false.
 */

export const getCanModifyLabwareQuantity = (
  labwareDef: LabwareDefinition,
  isOnHopper: boolean
): boolean => getIsLid(labwareDef) || isOnHopper
