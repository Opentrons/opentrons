import reduce from 'lodash/reduce'
import { createSelector } from 'reselect'

import { DIRTY, EMPTY } from '@opentrons/step-generation'

import { selectors as fileDataSelectors } from '../../file-data'
import { selectors as stepFormSelectors } from '../../step-forms'
import {
  END_TERMINAL_ITEM_ID,
  HARDWARE_ID,
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
  { missingTips: WellGroup; usedTips: WellGroup }
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
    let robotState = null
    if (activeItem == null) return null

    if (
      activeItem.selectionType === TERMINAL_ITEM_SELECTION_TYPE &&
      activeItem.id !== HARDWARE_ID
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
      activeItem.id === HARDWARE_ID &&
      selectedTerminalItemId === START_TERMINAL_ITEM_ID
    ) {
      robotState = initialRobotState
    } else if (
      activeItem.id === HARDWARE_ID &&
      (selectedTerminalItemId === END_TERMINAL_ITEM_ID ||
        selectedTerminalItemId === PRESAVED_STEP_ID)
    ) {
      robotState = lastValidRobotState
    } else {
      const stepId =
        activeItem.id === HARDWARE_ID && selectedStepId != null
          ? selectedStepId
          : activeItem.id
      const timeline = robotStateTimeline.timeline
      const timelineIdx = orderedStepIds.includes(stepId)
        ? orderedStepIds.findIndex(id => id === stepId)
        : null

      if (timelineIdx == null || stepId === HARDWARE_ID) {
        if (stepId !== HARDWARE_ID) {
          console.error(`Expected non-null timelineIdx for step ${stepId}`)
        }
        return null
      }

      const prevFrame = timeline[timelineIdx - 1]
      if (prevFrame) robotState = prevFrame.robotState
    }

    const missingAndUsedTips =
      robotState && robotState.tipState
        ? reduce(
            robotState.tipState.tipracks,
            (accOuter, tiprackState, tiprackId) => {
              const tiprackMissingAndUsedTips = reduce(
                tiprackState,
                (accInner, tipState, wellName) => {
                  if (tipState === EMPTY) {
                    return {
                      ...accInner,
                      missingTips: {
                        ...accInner.missingTips,
                        [wellName]: null,
                      },
                    }
                  } else if (tipState === DIRTY) {
                    return {
                      ...accInner,
                      usedTips: {
                        ...accInner.usedTips,
                        [wellName]: null,
                      },
                    }
                  }
                  return accInner
                },
                { missingTips: {}, usedTips: {} }
              )
              return { ...accOuter, [tiprackId]: tiprackMissingAndUsedTips }
            },
            {}
          )
        : null

    return missingAndUsedTips
  }
)
