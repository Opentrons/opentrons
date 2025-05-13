import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import { createSelector } from 'reselect'

import { selectors as fileDataSelectors } from '../../file-data'
import { selectors as stepFormSelectors } from '../../step-forms'
import {
  END_TERMINAL_ITEM_ID,
  HARDWARE_ID,
  LIQUID_ID,
  PRESAVED_STEP_ID,
  START_TERMINAL_ITEM_ID,
} from '../../steplist'
import {
  getActiveItem,
  getSelectedStepId,
  getSelectedTerminalItemId,
} from '../../ui/steps'
import { TERMINAL_ITEM_SELECTION_TYPE } from '../../ui/steps/reducers'

import type { WellGroup } from '@opentrons/components'
import type { Selector } from '../../types'

export const getMissingTipsByLabwareId: Selector<Record<
  string,
  WellGroup
> | null> = createSelector(
  stepFormSelectors.getOrderedStepIds,
  fileDataSelectors.getRobotStateTimeline,
  getActiveItem,
  fileDataSelectors.getInitialRobotState,
  fileDataSelectors.lastValidRobotState,
  getSelectedStepId,
  getSelectedTerminalItemId,
  (
    orderedStepIds,
    robotStateTimeline,
    activeItem,
    initialRobotState,
    lastValidRobotState,
    selectedStepId,
    selectedTerminalItemId
  ) => {
    if (activeItem == null) return null
    const isActiveItemHardwareOrLiquid =
      activeItem.id === HARDWARE_ID || activeItem.id === LIQUID_ID
    let robotState = null
    if (
      activeItem.selectionType === TERMINAL_ITEM_SELECTION_TYPE &&
      !isActiveItemHardwareOrLiquid
    ) {
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
          `Invalid terminalId ${terminalId}, could not getMissingTipsByLabwareId`
        )
      }
    } else if (
      isActiveItemHardwareOrLiquid &&
      selectedTerminalItemId === START_TERMINAL_ITEM_ID
    ) {
      robotState = initialRobotState
    } else if (
      isActiveItemHardwareOrLiquid &&
      (selectedTerminalItemId === END_TERMINAL_ITEM_ID ||
        selectedTerminalItemId === PRESAVED_STEP_ID)
    ) {
      robotState = lastValidRobotState
    } else {
      const stepId =
        isActiveItemHardwareOrLiquid && selectedStepId != null
          ? selectedStepId
          : activeItem.id

      const timeline = robotStateTimeline.timeline
      const timelineIdx = orderedStepIds.includes(stepId)
        ? orderedStepIds.findIndex(id => id === stepId)
        : null

      if (
        timelineIdx == null ||
        stepId === HARDWARE_ID ||
        stepId === LIQUID_ID
      ) {
        if (stepId !== HARDWARE_ID && stepId !== LIQUID_ID) {
          console.error(`Expected non-null timelineIdx for step ${stepId}`)
        }
        return null
      }

      const prevFrame = timeline[timelineIdx - 1]
      if (prevFrame) robotState = prevFrame.robotState
    }

    const missingTips =
      robotState &&
      robotState.tipState &&
      mapValues(robotState.tipState.tipracks, tipMap =>
        reduce(
          tipMap,
          (acc, hasTip, wellName): WellGroup =>
            hasTip ? acc : { ...acc, [wellName]: null },
          {}
        )
      )
    return missingTips
  }
)
