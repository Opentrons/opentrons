import type { LabwareType } from '../fields'

/** Plate height is total extents. Skirt metadata is optional. */
export function labwareAllowsProtrudingWells(
  labwareType: LabwareType | null | undefined
): boolean {
  return labwareType === 'wellPlate' || labwareType === 'filterPlate'
}
