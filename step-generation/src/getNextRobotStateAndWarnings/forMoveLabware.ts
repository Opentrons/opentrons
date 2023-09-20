import * as warningCreators from '../warningCreators'
import type { MoveLabwareParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forMoveLabware(
  params: MoveLabwareParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { labwareId, newLocation } = params
  const { robotState, warnings } = robotStateAndWarnings
  console.log('warnings before', warnings.length)
  warnings.push(warningCreators.moveNonemptyLabwareToWasteChute())
  console.log('warnings after', warnings.length)
  const { liquidState, tipState } = robotState
  const test = liquidState.labware[labwareId]
  const tiprackHasTip =
    tipState.tipracks[labwareId] != null
      ? Object.values(tipState.tipracks[labwareId]).some(
          value => value === true
        )
      : false
  console.log('tiprackHasTip', tiprackHasTip)
  let newLocationString = ''
  if (newLocation === 'offDeck') {
    newLocationString = newLocation
  } else if ('moduleId' in newLocation) {
    newLocationString = newLocation.moduleId
  } else if ('slotName' in newLocation) {
    newLocationString = newLocation.slotName
  } else if ('labwareId' in newLocation) {
    newLocationString = newLocation.labwareId
  }
  console.log(newLocationString)
  console.log(tiprackHasTip && newLocationString === 'D3')

  robotState.labware[labwareId].slot = newLocationString
}
