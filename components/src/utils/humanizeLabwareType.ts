export const humanizeLabwareType = (labwareType: string): string => {
  return labwareType.replace(/-|_/g, ' ')
}
