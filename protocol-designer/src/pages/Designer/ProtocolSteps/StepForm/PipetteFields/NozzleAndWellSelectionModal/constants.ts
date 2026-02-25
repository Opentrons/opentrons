import type { PartialPrimaryNozzles } from '@opentrons/shared-data'

export const INACCESSIBLE_PARTIAL_TIP: 'partial_tip' = 'partial_tip'

export const partialNozzleMap: Record<PartialPrimaryNozzles, number> = {
  G1: 2,
  F1: 3,
  E1: 4,
  D1: 5,
  C1: 6,
  B1: 7,
}
