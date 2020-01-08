// @flow
import { GEN_ONE_MULTI_PIPETTES, TEMPDECK, MAGDECK } from '../../constants'
import type { InvariantContext, RobotState } from '../types'

// HACK Ian 2019-11-12: this is a temporary solution to pass PD runtime feature flags
// down into step-generation, which is meant to be relatively independent of PD.
// WARNING: Unless you're careful to bust any caches (eg of selectors that use step-generation),
// there could be delayed-sync issues when toggling a flag with this solution, because
// we're directly accessing localStorage without an ability to.
// A long-term solution might be to either restart PD upon setting flags that are used here,
// or pass flags as "config options" into step-generation via a factory that stands in front of all step-generation imports,
// or just avoid this complexity for non-experimental features.
const _getFeatureFlag = (flagName: string): boolean => {
  if (!global.localStorage) {
    let value = false
    try {
      value = process.env[flagName] === 'true'
    } catch (e) {
      console.error(
        `appear to be in node environment, but cannot access ${flagName} in process.env. ${e}`
      )
    }
    return value
  }
  const allFlags = JSON.parse(
    global.localStorage.getItem('root.featureFlags.flags') || '{}'
  )
  return (allFlags && allFlags[flagName]) || false
}

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
  const pipetteEntity: ?* = pipette && invariantContext.pipetteEntities[pipette]
  const labwareSlot: ?* = labware && prevRobotState.labware[labware]?.slot
  if (!pipette || !labware || !pipetteEntity || !labwareSlot) return false

  // NOTE: does not handle thermocycler-adjacent slots.
  // Only handles labware is NORTH of mag/temp in slot 1 or 3
  // Does not care about GEN1/GEN2 module, just GEN1 multi-ch pipette
  const labwareInDangerZone = Object.keys(invariantContext.moduleEntities).some(
    moduleId => {
      const moduleSlot: ?* = prevRobotState.modules[moduleId]?.slot
      const moduleType: ?* = invariantContext.moduleEntities[moduleId]?.type
      const hasNorthSouthProblem = [TEMPDECK, MAGDECK].includes(moduleType)
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
