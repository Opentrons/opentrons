import { getIsLid, getIsPipettableLabware } from '@opentrons/shared-data'

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
  const { labwareEntities } = invariantContext
  const { modules, labware } = robotState
  const initialDeckSlot = getSlotInLocationStack(labware[labwareId].stack)
  const fullStackFromLabwares = getFullStackFromLabwares(
    labware,
    initialDeckSlot
  )
  const index = fullStackFromLabwares.indexOf(labwareId)
  const labwareToMove = fullStackFromLabwares.slice(0, index + 1) // includes labwareId you're moving

  const isLabwareToMoveLid = getIsLid(labwareEntities[labwareId].def)
  let isParentPipettableLabware: boolean = false

  const newLocationStack: string[] = []
  if (newLocation === 'offDeck' || newLocation === 'systemLocation') {
    newLocationStack.push(newLocation)
  } else if ('moduleId' in newLocation) {
    newLocationStack.push(
      newLocation.moduleId,
      modules[newLocation.moduleId].slot
    )
  } else if ('slotName' in newLocation) {
    // need to handle slotName being a labwareId or a slotId (misleading property name)
    const { slotName } = newLocation
    // new location is a labware stack
    if (slotName in labware) {
      isParentPipettableLabware = getIsPipettableLabware(
        labwareEntities[slotName].def
      )
      newLocationStack.push(...labware[slotName].stack)
    } else {
      // new location is a slot
      newLocationStack.push(slotName)
    }
  } else if ('labwareId' in newLocation) {
    const labwareId = newLocation.labwareId
    isParentPipettableLabware = getIsPipettableLabware(
      labwareEntities[labwareId].def
    )
    const labwareIdStack = labware[labwareId].stack
    newLocationStack.push(...labwareIdStack)
  } else if ('addressableAreaName' in newLocation) {
    newLocationStack.push(newLocation.addressableAreaName)
  }
  labwareToMove.forEach((id, i) => {
    if (labware[id] != null) {
      const stackBelow = labwareToMove.slice(i + 1) // what's under labware you're moving
      robotState.labware[id] = {
        ...robotState.labware[id],
        stack: [id, ...stackBelow, ...newLocationStack],
        isUsedLid: isLabwareToMoveLid && isParentPipettableLabware,
      }
    }
  })
}
