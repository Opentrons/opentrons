import { createSelector } from 'reselect'
import { THERMOCYCLER_MODULE_TYPE, getDeckDefFromRobotType } from '@opentrons/shared-data'
import {
  START_TERMINAL_ITEM_ID,
  END_TERMINAL_ITEM_ID,
  PRESAVED_STEP_ID,
} from '../../steplist'
import { selectors as stepFormSelectors } from '../../step-forms'
import { getActiveItem } from '../../ui/steps'
import { TERMINAL_ITEM_SELECTION_TYPE } from '../../ui/steps/reducers'
import { selectors as fileDataSelectors } from '../../file-data'
import { Selector } from '../../types'
import {  getModuleEntities } from '../../step-forms/selectors'

export const getUnocuppiedLabwareLocations: Selector<string[] | null> = createSelector(
  stepFormSelectors.getOrderedStepIds,
  fileDataSelectors.getRobotStateTimeline,
  getActiveItem,
  fileDataSelectors.getInitialRobotState,
  fileDataSelectors.lastValidRobotState,
  getModuleEntities,
  (
    orderedStepIds,
    robotStateTimeline,
    activeItem,
    initialRobotState,
    lastValidRobotState,
    moduleEntities,
  ) => {
    let robotState = null
    if (activeItem == null) return null

    if (activeItem.selectionType === TERMINAL_ITEM_SELECTION_TYPE) {
      const terminalId = activeItem.id

      if (terminalId === START_TERMINAL_ITEM_ID) {
        robotState = initialRobotState
      } else if (
        terminalId === END_TERMINAL_ITEM_ID ||
        terminalId === PRESAVED_STEP_ID
      ) {
        robotState = lastValidRobotState
      } else {
        console.error(
          `Invalid terminalId ${terminalId}, could not getUnoccupiedLabwareLocations`
        )
      }
    } else {
      const stepId = activeItem.id
      const timeline = robotStateTimeline.timeline
      const timelineIdx = orderedStepIds.includes(stepId)
        ? orderedStepIds.findIndex(id => id === stepId)
        : null

      if (timelineIdx == null) {
        console.error(`Expected non-null timelineIdx for step ${stepId}`)
        return null
      }

      const prevFrame = timeline[timelineIdx - 1]
      if (prevFrame) robotState = prevFrame.robotState
    }

    if (robotState == null) return null


    // TODO IMMEDIATElY: get robot type from global state
    const robotType = 'OT-2 Standard'
    const deckDef = getDeckDefFromRobotType(robotType)
    const allSlotIds = deckDef.locations.orderedSlots.map(slot => slot.id)

    const {modules, labware} = robotState 
    const slotIdsOccupiedByModules = Object.entries(modules).reduce<string[]>((acc, [modId, modOnDeck]) => {
      if (moduleEntities[modId]?.type === THERMOCYCLER_MODULE_TYPE) {
        return robotType === 'OT-2 Standard' ? [...acc, '7', '8', '10', '11'] : [...acc, 'A1', 'B1'] 
      } else {
        return [...acc, modOnDeck.slot]
      }
    }, [])
    
    const unoccupiedModuleIds = Object.entries(modules).reduce<string[]>((acc, [modId, modOnDeck]) => { 
      const moduleHasLabware = Object.entries(labware).some(([lwId, lwOnDeck]) => lwOnDeck.slot === modId)
      return moduleHasLabware ? acc : [...acc, modId]
    }, [])

    const unoccupiedSlotIds = allSlotIds.filter(slotId => (
      !slotIdsOccupiedByModules.includes(slotId) && !Object.values(labware).map(lw => lw.slot).includes(slotId)
    ))

    console.log('GOT TO BOTTOM')
    return [...unoccupiedModuleIds, ...unoccupiedSlotIds]
  }
)
