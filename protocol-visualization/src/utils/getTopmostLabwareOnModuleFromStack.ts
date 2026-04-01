import type { LabwareTemporalProperties } from '@opentrons/step-generation'

export const getTopmostLabwareOnModuleFromStack = (
  moduleId: string,
  labware: LabwareTemporalProperties[]
): string => {
  return labware
    .filter(lw => lw.stack.includes(moduleId))
    .sort((a, b) => b.stack.length - a.stack.length)[0]?.stack[0]
}
