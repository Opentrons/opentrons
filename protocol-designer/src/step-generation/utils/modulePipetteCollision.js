// @flow
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'
import { GEN_ONE_MULTI_PIPETTES } from '../../constants'
import { _getFeatureFlag } from './_getFeatureFlag'
import type { PipetteEntity } from '../../step-forms/types'
import type { DeckSlot } from '../../types'
import type { InvariantContext, RobotState } from '../types'
export const modulePipetteCollision = (args: {|
  pipette: ?string,
  labware: ?string,
  invariantContext: InvariantContext,
  prevRobotState: RobotState,
|}): boolean => {
  if (_getFeatureFlag('OT_PD_DISABLE_MODULE_RESTRICTIONS')) {
    // always ignore collision hazard
    return false
  }
  const { pipette, labware, invariantContext, prevRobotState } = args
  const pipetteEntity: ?PipetteEntity = pipette
    ? invariantContext.pipetteEntities[pipette]
    : null
  const labwareSlot: ?DeckSlot = labware
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
      const moduleSlot: ?DeckSlot = prevRobotState.modules[moduleId]?.slot
      const moduleType: ?string =
        invariantContext.moduleEntities[moduleId]?.type
      const hasNorthSouthProblem = [
        MAGNETIC_MODULE_TYPE,
        TEMPERATURE_MODULE_TYPE,
      ].includes(moduleType)
      const labwareInNorthSlot =
        (moduleSlot === '1' && labwareSlot === '4') ||
        (moduleSlot === '3' && labwareSlot === '6')
      return hasNorthSouthProblem && labwareInNorthSlot
    }
  )

  return (
    GEN_ONE_MULTI_PIPETTES.includes(pipetteEntity.name) && labwareInDangerZone
  )
}
