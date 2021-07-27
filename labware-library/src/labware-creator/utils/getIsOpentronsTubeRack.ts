import { LabwareFields, ProcessedLabwareFields } from '../fields'

// NOTE: if tubeRackInsertLoadName is blank,
// assume Opentrons tube rack (aka non-custom tube rack)
export const getIsOpentronsTubeRack = (
  values: LabwareFields | ProcessedLabwareFields
): boolean =>
  values.labwareType === 'tubeRack' &&
  values.tubeRackInsertLoadName !== 'customTubeRack'
