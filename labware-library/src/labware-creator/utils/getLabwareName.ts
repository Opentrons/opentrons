import { LabwareFields } from '../fields'

export const getLabwareName = (
  values: LabwareFields,
  plural: boolean
): string => {
  const { labwareType } = values
  switch (labwareType) {
    case 'tipRack':
      return `tip${plural ? 's' : ''}`
    case 'aluminumBlock':
    case 'tubeRack':
      return `tube${plural ? 's' : ''}`
    case 'wellPlate':
    case 'reservoir':
    default:
      return `well${plural ? 's' : ''}`
  }
}
