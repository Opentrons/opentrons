import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'
import type { RobotState } from '../'
export const pipetteIntoHeaterShakerLatchOpen = (
  modules: RobotState['modules'],
  labware: RobotState['labware'],
  labwareId: string
): boolean => {
  const labwareSlot: string = labware[labwareId]?.slot
  const moduleUnderLabware: string | null | undefined =
    modules &&
    labwareSlot &&
    Object.keys(modules).find((moduleId: string) => moduleId === labwareSlot)
  const moduleState =
    moduleUnderLabware && modules[moduleUnderLabware].moduleState
  const isHSLatchOpen: boolean = Boolean(
    moduleState &&
      moduleState.type === HEATERSHAKER_MODULE_TYPE &&
      moduleState.latchOpen !== false
  )
  return isHSLatchOpen
}
