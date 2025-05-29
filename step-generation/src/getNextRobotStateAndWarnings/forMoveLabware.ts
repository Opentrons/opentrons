import { getFullStackFromLabwares, getSlotInLocationStack } from '../utils'

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
  const initialDeckSlot = getSlotInLocationStack(labware[labwareId].stack)
  const fullStackFromLabwares = getFullStackFromLabwares(
    labware,
    initialDeckSlot
  )
  const index = fullStackFromLabwares.indexOf(labwareId)
  const restOfStack = index !== -1 ? fullStackFromLabwares.slice(0, index) : []

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

  // robotState.labware[labwareId].stack = [...restOfStack, ...newLocationStack]
  fullStackFromLabwares.forEach((id, i) => {
    if (labware[id] != null) {
      const idStackSuffix =
        index !== -1 ? fullStackFromLabwares.slice(0, i) : [] // part after this labware
      robotState.labware[id].stack = [...idStackSuffix, ...newLocationStack]
    }
  })
}
