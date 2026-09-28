import type { LabwareDefinition2 } from '@opentrons/shared-data'

/** Vacuum collars (not spacers) that a filter plate can sit on. */
export function isVacuumCollar(definition: LabwareDefinition2): boolean {
  const quirks = definition.parameters.quirks ?? []
  return (
    quirks.includes('vacuumModuleDock') && !quirks.includes('vacuumSpacer')
  )
}

/**
 * How far below the collar's top the seating ledge sits. Both vacuum collars
 * publish this as `stackingOffsetWithLabware.default.z` (currently 3.5 mm).
 */
export function getVacuumCollarSeatingInset(
  collarDefinition: LabwareDefinition2
): number {
  return collarDefinition.stackingOffsetWithLabware?.default?.z ?? 0
}

/**
 * Combined height measurement for LC's stacking field when a filter plate's
 * skirt rests on the collar seating ledge and the wells hang into the collar.
 *
 * measurement = collarHeight - seatingInset + skirtHeight
 *
 * LC later stores overlap as `labwareHeight + collarHeight - measurement`,
 * which becomes `labwareHeight - skirtHeight + seatingInset`.
 */
export function getVacuumCollarStackingMeasurement(
  collarHeight: number,
  skirtHeight: number,
  seatingInset: number = 0
): number {
  return Math.round((collarHeight - seatingInset + skirtHeight) * 100) / 100
}
