import { createSelector } from 'reselect'
import { THERMOCYCLER_MODULE_TYPE, getDeckDefFromRobotType, getModuleDisplayName } from '@opentrons/shared-data'
import {
  START_TERMINAL_ITEM_ID,
  END_TERMINAL_ITEM_ID,
  PRESAVED_STEP_ID,
} from '../../steplist'
import { LabwareOnDeck, ModuleOnDeck, PipetteOnDeck, selectors as stepFormSelectors } from '../../step-forms'
import { getActiveItem } from '../../ui/steps'
import { TERMINAL_ITEM_SELECTION_TYPE } from '../../ui/steps/reducers'
import { selectors as fileDataSelectors } from '../../file-data'
import { Selector } from '../../types'
import { getLabwareEntities, getModuleEntities, getPipetteEntities } from '../../step-forms/selectors'
import type { RobotState } from '@opentrons/step-generation'


interface Option {
  name: string
  value: string
}

export const getRobotStateAtActiveItem: Selector<RobotState | null> = createSelector(
  stepFormSelectors.getOrderedStepIds,
  fileDataSelectors.getRobotStateTimeline,
  getActiveItem,
  fileDataSelectors.getInitialRobotState,
  fileDataSelectors.lastValidRobotState,
  (
    orderedStepIds,
    robotStateTimeline,
    activeItem,
    initialRobotState,
    lastValidRobotState,
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
          `Invalid terminalId ${terminalId}, could not robotState of active item`
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
      if (timelineIdx === 0) {
        robotState = initialRobotState
      } else {
        const prevFrame = timeline[timelineIdx - 1]
        if (prevFrame) robotState = prevFrame.robotState
      }
    }

    return robotState
  }
)


export const getUnocuppiedLabwareLocationOptions: Selector<Option[] | null> = createSelector(
  getRobotStateAtActiveItem,
  getModuleEntities,
  (robotState, moduleEntities) => {
    // TODO IMMEDIATElY: get robot type from global state
    const robotType = 'OT-2 Standard'
    const deckDef = getDeckDefFromRobotType(robotType)
    const allSlotIds = deckDef.locations.orderedSlots.map(slot => slot.id)
    if (robotState == null) return null

    const { modules, labware } = robotState
    const slotIdsOccupiedByModules = Object.entries(modules).reduce<string[]>((acc, [modId, modOnDeck]) => {
      if (moduleEntities[modId]?.type === THERMOCYCLER_MODULE_TYPE) {
        return robotType === 'OT-2 Standard' ? [...acc, '7', '8', '10', '11'] : [...acc, 'A1', 'B1']
      } else {
        return [...acc, modOnDeck.slot]
      }
    }, [])

    const unoccupiedModuleOptions = Object.keys(modules).reduce<Option[]>((acc, modId) => {
      const moduleHasLabware = Object.entries(labware).some(([lwId, lwOnDeck]) => lwOnDeck.slot === modId)
      return moduleHasLabware ? acc : [
        ...acc,
        { name: getModuleDisplayName(moduleEntities[modId].model), value: modId }
      ]
    }, [])

    const unoccupiedSlotOptions = allSlotIds.filter(slotId => (
      !slotIdsOccupiedByModules.includes(slotId) && !Object.values(labware).map(lw => lw.slot).includes(slotId)
    )).map(slotId => ({ name: slotId, value: slotId }))

    return [...unoccupiedModuleOptions, ...unoccupiedSlotOptions]
  }
)

export const getLabwareOnDeckForActiveItem: Selector<LabwareOnDeck[] | null> = createSelector(
  getRobotStateAtActiveItem,
  getLabwareEntities,
  (
    robotState,
    labwareEntities,
  ) => {
    if (robotState == null) return null
    return Object.entries(labwareEntities).map(([lwId, lwEntity]) => ({
      ...lwEntity,
      ...robotState.labware[lwId]
    }))
  }
)

export const getModulesOnDeckForActiveItem: Selector<ModuleOnDeck[] | null> = createSelector(
  getRobotStateAtActiveItem,
  getModuleEntities,
  (
    robotState,
    moduleEntities,
  ) => {
    if (robotState == null) return null
    return Object.entries(moduleEntities).map(([modId, modEntity]) => ({
      ...modEntity,
      ...robotState.modules[modId]
    }))
  }
)

export const getPipettesForActiveItem: Selector<PipetteOnDeck[] | null> = createSelector(
  getRobotStateAtActiveItem,
  getPipetteEntities,
  (
    robotState,
    pipetteEntities,
  ) => {
    if (robotState == null) return null
    return Object.entries(pipetteEntities).map(([pipId, pipEntity]) => ({
      ...pipEntity,
      ...robotState.pipettes[pipId]
    }))
  }
)