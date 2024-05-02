import { GEN_ONE_MULTI_PIPETTES } from '@opentrons/shared-data'
import { MODULES_WITH_COLLISION_ISSUES } from '../constants'
import type {
  DeckSlot,
  PipetteEntity,
  InvariantContext,
  RobotState,
} from '../types'
export const modulePipetteCollision = (args: {
  pipette: string | null | undefined
  labware: string | null | undefined
  invariantContext: InvariantContext
  prevRobotState: RobotState
}): boolean => {
  const { pipette, labware, invariantContext, prevRobotState } = args

  if (invariantContext.config.OT_PD_DISABLE_MODULE_RESTRICTIONS) {
    // always ignore collision hazard
    return false
  }

  const pipetteEntity: PipetteEntity | null | undefined = pipette
    ? invariantContext.pipetteEntities[pipette]
    : null
  const labwareSlot: DeckSlot | null | undefined = labware
    ? prevRobotState.labware[labware]?.slot
    : null

  if (!pipette || !labware || !pipetteEntity || !labwareSlot) {
    return false
  }

  // NOTE: does not handle thermocycler-adjacent slots.
  // Only handles labware is NORTH of mag/temp in slot 1 or 3
  // Does not care about GEN1/GEN2 module, just GEN1 multi-ch pipette
  const labwareInDangerZone = Object.keys(invariantContext.moduleEntities).some(
    moduleId => {
      const moduleModel = invariantContext.moduleEntities[moduleId].model
      if (MODULES_WITH_COLLISION_ISSUES.includes(moduleModel)) {
        const moduleSlot: DeckSlot | null | undefined =
          prevRobotState.modules[moduleId]?.slot
        const labwareInNorthSlot =
          (moduleSlot === '1' && labwareSlot === '4') ||
          (moduleSlot === '3' && labwareSlot === '6')
        return labwareInNorthSlot
      } else {
        return false
      }
    }
  )
  return (
    GEN_ONE_MULTI_PIPETTES.includes(pipetteEntity.name) && labwareInDangerZone
  )
}
