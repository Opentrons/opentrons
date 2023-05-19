import {
  LABWARE_MOVE_DELAY_MS,
  LABWARE_MOVE_DURATION_MS,
  LABWARE_MOVE_TO_OFFDECK_DELAY_MS,
  LABWARE_MOVE_TO_OFFDECK_DURATION_MS,
  OT2_STANDARD_SLOT_HEIGHT,
  OT3_STANDARD_SLOT_HEIGHT,
} from './animationConstants'

import type { RunCommandSummary } from '@opentrons/api-client'
import type { MoveLabwareAnimationParams } from '@opentrons/components'
import type { DeckDefinition } from '@opentrons/shared-data'
import type { RunLabwareInfo } from './getCurrentRunLabwareRenderInfo'
import type { RunModuleInfo } from './getCurrentRunModulesRenderInfo'

export function getLabwareMovementAnimationParams(
  runLabwareInfo: RunLabwareInfo[],
  runModuleInfo: RunModuleInfo[],
  command: RunCommandSummary,
  deckDef: DeckDefinition
): MoveLabwareAnimationParams | null {
  const labwareId = command.params.labwareId
  let labwareFromRun:
    | RunLabwareInfo
    | RunModuleInfo
    | undefined = runLabwareInfo.find(l => l.labwareId === labwareId)
  if (labwareFromRun == null) {
    labwareFromRun = runModuleInfo.find(m => m.nestedLabwareId === labwareId)
    if (labwareFromRun == null) {
      return null
    }
  }
  const currentPos = [labwareFromRun.x, labwareFromRun.y]
  let newPos: [number, number] | null = null
  if (command.params?.newLocation === 'offDeck') {
    // we want the labware to slide straight down off the deck
    // so we maintain the x position and set the y to the negative height of the slot for the deck type so the labware completely leaves the deck map
    newPos = [
      labwareFromRun.x,
      deckDef.otId === 'ot3_standard'
        ? OT3_STANDARD_SLOT_HEIGHT * -1
        : OT2_STANDARD_SLOT_HEIGHT * -1,
    ]
  } else if ('moduleId' in command.params?.newLocation) {
    const matchedModule = runModuleInfo.find(
      m => m.moduleId === command.params.newLocation.moduleId
    )
    newPos = matchedModule != null ? [matchedModule.x, matchedModule.y] : null
  } else {
    const slotPosition = deckDef.locations.orderedSlots.find(
      slot => slot.id === command.params.newLocation.slotName
    )?.position
    if (slotPosition == null) {
      return null
    }
    newPos = [slotPosition[0], slotPosition[1]]
  }

  return newPos != null
    ? {
        xMovement: newPos[0] - currentPos[0],
        yMovement: newPos[1] - currentPos[1],
        begin:
          command.params.newLocation === 'offDeck'
            ? `${LABWARE_MOVE_TO_OFFDECK_DELAY_MS}ms;labware-move.end+500ms` // these are all a bit placeholder-y for now until the other animations exist to sync off of
            : `${LABWARE_MOVE_DELAY_MS}ms;splash.end+300ms`,
        duration:
          command.params.newLocation === 'offDeck'
            ? `${LABWARE_MOVE_TO_OFFDECK_DURATION_MS}ms`
            : `${LABWARE_MOVE_DURATION_MS}ms`,
      }
    : null
}
