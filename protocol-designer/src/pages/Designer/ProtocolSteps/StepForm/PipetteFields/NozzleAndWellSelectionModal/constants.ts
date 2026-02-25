import type { PartialPrimaryNozzles } from '@opentrons/shared-data'

export const INACCESSIBLE_PARTIAL_TIP: 'partial_tip' = 'partial_tip'

type PartialNozzles8Channel = 2 | 3 | 4 | 5 | 6 | 7

export const partialNozzleMap: Record<
  PartialPrimaryNozzles,
  PartialNozzles8Channel
> = {
  G1: 2,
  F1: 3,
  E1: 4,
  D1: 5,
  C1: 6,
  B1: 7,
}

export const PLURAL_COLUMNS: 'columns' = 'columns'
export const PLURAL_ROWS: 'rows' = 'rows'
