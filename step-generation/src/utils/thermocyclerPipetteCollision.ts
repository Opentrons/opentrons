import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import type { RobotState } from '../'
export const thermocyclerPipetteCollision = (
  modules: RobotState['modules'],
  labware: RobotState['labware'],
  labwareId: string
): boolean => {
  const labwareSlot: string = labware[labwareId]?.slot
  const moduleUnderLabware: string | null | undefined =
    (modules != null && labwareSlot != null)
      ? Object.keys(modules).find((moduleId: string) => moduleId === labwareSlot)
      : null
  const moduleState = moduleUnderLabware != null ? modules[moduleUnderLabware].moduleState : null
  const isTCLidClosed: boolean = Boolean(
    moduleState != null &&
    moduleState.type === THERMOCYCLER_MODULE_TYPE &&
    moduleState.lidOpen !== true
  )
  return isTCLidClosed
}
