import type { CutoutConfig, LabwareDefinition2 } from '@opentrons/shared-data'

/** Check if the drop tip location is a tip rack. */
export const isTipRackDropLocation = (
  dropTipLocation: CutoutConfig | LabwareDefinition2
): boolean => {
  return 'ordering' in dropTipLocation
}
