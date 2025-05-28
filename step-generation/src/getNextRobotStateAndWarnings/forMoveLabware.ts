import type { MoveLabwareParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forMoveLabware(
  params: MoveLabwareParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { labwareId, newLocation } = params
  const { robotState } = robotStateAndWarnings
  const { modules, labware } = robotState

  const newLocationStack = [labwareId]
  if (newLocation === 'offDeck' || newLocation === 'systemLocation') {
    newLocationStack.push(newLocation)
  } else if ('moduleId' in newLocation) {
    newLocationStack.push(
      newLocation.moduleId,
      modules[newLocation.moduleId].slot
    )
  } else if ('slotName' in newLocation) {
    newLocationStack.push(newLocation.slotName)
  } else if ('labwareId' in newLocation) {
    const labwareId = newLocation.labwareId
    const labwareIdStack = labware[labwareId].stack
    newLocationStack.push(labwareId, ...labwareIdStack)
  } else if ('addressableAreaName' in newLocation) {
    newLocationStack.push(newLocation.addressableAreaName)
  }

  robotState.labware[labwareId].stack = newLocationStack
}
