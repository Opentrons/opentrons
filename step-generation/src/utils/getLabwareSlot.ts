import { RobotState } from '../types'

// this function returns the slot a labware is in (which should be a string 1-12)
// the reason this function is needed is because if a labware is on top of a module
// the "slot" value it holds is the module id of the module it occupies.
export const getLabwareSlot = (
  labwareId: string,
  labware: RobotState['labware'],
  modules: RobotState['modules']
): string => {
  const labwareSlotOrModuleId = labware[labwareId]?.slot
  const isLabwareOnTopOfModule = labwareSlotOrModuleId in modules
  const slotName = isLabwareOnTopOfModule
    ? modules[labwareSlotOrModuleId].slot
    : labwareSlotOrModuleId

  return slotName
}
