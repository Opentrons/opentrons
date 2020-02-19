// @flow
import { createSelector } from 'reselect'

import assert from 'assert'

import { selectors as fileDataSelectors } from '../file-data'
import { selectors as stepFormSelectors } from '../step-forms'
import { getActiveItem } from '../ui/steps'
import { START_TERMINAL_ITEM_ID } from '../steplist'

import type { Selector } from '../types'
import type { CommandsAndRobotState } from '../step-generation'

const _timelineFrameHelper = (beforeActiveItem: boolean) => (
  activeItem,
  initialRobotState,
  robotStateTimeline,
  lastValidRobotState,
  orderedStepIds
): CommandsAndRobotState => {
  // Add pseudo-frames for start and end terminal items
  const timeline = [
    { robotState: initialRobotState, commands: [] },
    ...robotStateTimeline.timeline,
    { robotState: lastValidRobotState, commands: [] },
  ]
  const lastValidRobotStateIdx = timeline.length - 1
  let timelineIdx = lastValidRobotStateIdx // default to last valid robot state

  if (beforeActiveItem) {
    if (activeItem.isStep) {
      timelineIdx = Math.min(
        orderedStepIds.findIndex(id => id === activeItem.id),
        lastValidRobotStateIdx
      )
    } else if (activeItem.id === START_TERMINAL_ITEM_ID) {
      timelineIdx = 0
    }
  } else {
    // after active item
    const idxAfterStep =
      orderedStepIds.findIndex(id => id === activeItem.id) + 1
    if (activeItem.isStep && idxAfterStep <= lastValidRobotStateIdx) {
      timelineIdx = idxAfterStep
    } else if (activeItem.id === START_TERMINAL_ITEM_ID) {
      timelineIdx = 0
    }
  }

  assert(
    timelineIdx !== -1,
    `timelineFrameForActiveItem got unhandled terminal id: "${activeItem.id}"`
  )

  return timeline[timelineIdx]
}

export const timelineFrameBeforeActiveItem: Selector<CommandsAndRobotState> = createSelector(
  getActiveItem,
  fileDataSelectors.getInitialRobotState,
  fileDataSelectors.getRobotStateTimeline,
  fileDataSelectors.lastValidRobotState,
  stepFormSelectors.getOrderedStepIds,
  _timelineFrameHelper(true)
)

export const timelineFrameAfterActiveItem: Selector<CommandsAndRobotState> = createSelector(
  getActiveItem,
  fileDataSelectors.getInitialRobotState,
  fileDataSelectors.getRobotStateTimeline,
  fileDataSelectors.lastValidRobotState,
  stepFormSelectors.getOrderedStepIds,
  _timelineFrameHelper(false)
)
