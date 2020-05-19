// @flow
import { THERMOCYCLER_MODULE_TYPE } from '../../../../shared-data/js/constants'
import type { RobotState } from '../'

export const thermocyclerPipetteCollission = (
  robotState: RobotState,
  labwareId: string
): boolean => {
  const { modules, labware } = robotState
  const labwareSlot: string = labware[labwareId]?.slot

  const moduleUnderLabware: ?string =
    modules &&
    labwareSlot &&
    Object.keys(modules).find((moduleId: string) => moduleId === labwareSlot)

  const moduleState =
    moduleUnderLabware && modules[moduleUnderLabware].moduleState

  const isTCLidClosed: boolean = Boolean(
    moduleState &&
      moduleState.type === THERMOCYCLER_MODULE_TYPE &&
      moduleState.lidOpen !== true
  )

  return isTCLidClosed
}
