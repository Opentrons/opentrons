import { LabwareFields, ProcessedLabwareFields } from '../fields'

export const getIsCustomTubeRack = (
  values: LabwareFields | ProcessedLabwareFields
): boolean =>
  values.labwareType === 'tubeRack' &&
  values.tubeRackInsertLoadName === 'customTubeRack'
