import { LabwareFields } from '../fields'

export const displayAsTube = (values: LabwareFields): boolean =>
  values.labwareType === 'tubeRack' ||
  (values.labwareType === 'aluminumBlock' &&
    values.aluminumBlockType === '96well' &&
    values.aluminumBlockChildType != null &&
    ['tubes', 'pcrTubeStrip'].includes(values.aluminumBlockChildType))
