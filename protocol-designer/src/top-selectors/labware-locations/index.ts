import { createSelector } from 'reselect'
import mapValues from 'lodash/mapValues'
import {
  THERMOCYCLER_MODULE_TYPE,
  getDeckDefFromRobotType,
  getModuleDisplayName,
} from '@opentrons/shared-data'
import {
  START_TERMINAL_ITEM_ID,
  END_TERMINAL_ITEM_ID,
  PRESAVED_STEP_ID,
} from '../../steplist'
import {
  AllTemporalPropertiesForTimelineFrame,
  selectors as stepFormSelectors,
} from '../../step-forms'
import { getActiveItem } from '../../ui/steps'
import { TERMINAL_ITEM_SELECTION_TYPE } from '../../ui/steps/reducers'
import { selectors as fileDataSelectors } from '../../file-data'
import { getRobotType } from '../../file-data/selectors'
import { Selector } from '../../types'
import {
  getLabwareEntities,
  getModuleEntities,
  getPipetteEntities,
} from '../../step-forms/selectors'
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
    lastValidRobotState
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

export const getUnocuppiedLabwareLocationOptions: Selector<
  Option[] | null
> = createSelector(
  getRobotStateAtActiveItem,
  getModuleEntities,
  getRobotType,
  (robotState, moduleEntities, robotType) => {
    const deckDef = getDeckDefFromRobotType(robotType)
    const allSlotIds = deckDef.locations.orderedSlots.map(slot => slot.id)
    if (robotState == null) return null

    const { modules, labware } = robotState
    const slotIdsOccupiedByModules = Object.entries(modules).reduce<string[]>(
      (acc, [modId, modOnDeck]) => {
        if (moduleEntities[modId]?.type === THERMOCYCLER_MODULE_TYPE) {
          return robotType === 'OT-2 Standard'
            ? [...acc, '7', '8', '10', '11']
            : [...acc, 'A1', 'B1']
        } else {
          return [...acc, modOnDeck.slot]
        }
      },
      []
    )

    const unoccupiedModuleOptions = Object.entries(modules).reduce<Option[]>(
      (acc, [modId, modOnDeck]) => {
        const moduleHasLabware = Object.entries(labware).some(
          ([lwId, lwOnDeck]) => lwOnDeck.slot === modId
        )
        return moduleHasLabware
          ? acc
          : [
              ...acc,
              {
                name: `${getModuleDisplayName(
                  moduleEntities[modId].model
                )} in slot ${
                  modOnDeck.slot === 'span7_8_10_11'
                    ? '7, 8, 10, 11'
                    : modOnDeck.slot
                }`,
                value: modId,
              },
            ]
      },
      []
    )

    const unoccupiedSlotOptions = allSlotIds
      .filter(
        slotId =>
          !slotIdsOccupiedByModules.includes(slotId) &&
          !Object.values(labware)
            .map(lw => lw.slot)
            .includes(slotId)
      )
      .map(slotId => ({ name: slotId, value: slotId }))

    const offDeckSlot = Object.values(labware)
      .map(lw => lw.slot)
      .find(slot => slot === 'offDeck')
    const offDeck =
      offDeckSlot !== 'offDeck' ? { name: 'Off Deck', value: 'offDeck' } : null

    if (offDeck == null) {
      return [...unoccupiedModuleOptions, ...unoccupiedSlotOptions]
    } else {
      return [...unoccupiedModuleOptions, ...unoccupiedSlotOptions, offDeck]
    }
  }
)

export const getDeckSetupForActiveItem: Selector<AllTemporalPropertiesForTimelineFrame> = createSelector(
  getRobotStateAtActiveItem,
  getPipetteEntities,
  getModuleEntities,
  getLabwareEntities,
  (robotState, pipetteEntities, moduleEntities, labwareEntities) => {
    if (robotState == null) return { pipettes: {}, labware: {}, modules: {} }
    return {
      pipettes: mapValues(pipetteEntities, (pipEntity, pipId) => ({
        ...pipEntity,
        ...robotState.pipettes[pipId],
      })),
      labware: mapValues(labwareEntities, (lwEntity, lwId) => ({
        ...lwEntity,
        ...robotState.labware[lwId],
      })),
      modules: mapValues(moduleEntities, (modEntity, modId) => ({
        ...modEntity,
        ...robotState.modules[modId],
      })),
    }
  }
)
