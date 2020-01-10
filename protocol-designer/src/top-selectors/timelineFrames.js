// @flow
import { createSelector } from 'reselect'

import assert from 'assert'

import { selectors as fileDataSelectors } from '../file-data'
// import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../step-forms'
import { selectors as stepsSelectors } from '../ui/steps'
import { START_TERMINAL_ITEM_ID } from '../steplist'

import type { Selector } from '../types'
import type { CommandsAndRobotState } from '../step-generation'

// TODO IMMEDIATELY: copied from getAllWellContentsForActiveItem, import & use this there
export const timelineFrameBeforeActiveItem: Selector<CommandsAndRobotState> = createSelector(
  stepsSelectors.getActiveItem,
  fileDataSelectors.getInitialRobotState,
  fileDataSelectors.getRobotStateTimeline,
  fileDataSelectors.lastValidRobotState,
  stepFormSelectors.getOrderedStepIds,
  (
    activeItem,
    initialRobotState,
    robotStateTimeline,
    lastValidRobotState,
    orderedStepIds
  ) => {
    // Add pseudo-frames for start and end terminal items
    const timeline = [
      { robotState: initialRobotState, commands: [] },
      ...robotStateTimeline.timeline,
      { robotState: lastValidRobotState, commands: [] },
    ]
    const lastValidRobotStateIdx = timeline.length - 1
    let timelineIdx = lastValidRobotStateIdx // default to last valid robot state

    if (activeItem.isStep) {
      timelineIdx = Math.min(
        orderedStepIds.findIndex(id => id === activeItem.id),
        lastValidRobotStateIdx
      )
    } else if (activeItem.id === START_TERMINAL_ITEM_ID) {
      timelineIdx = 0
    }

    assert(
      timelineIdx !== -1,
      `timelineFrameForActiveItem got unhandled terminal id: "${activeItem.id}"`
    )

    return timeline[timelineIdx]
  }
)

// TODO IMMEDIATELY: de-duplicate code btw this and above
export const timelineFrameAfterActiveItem: Selector<CommandsAndRobotState> = createSelector(
  stepsSelectors.getActiveItem,
  fileDataSelectors.getInitialRobotState,
  fileDataSelectors.getRobotStateTimeline,
  fileDataSelectors.lastValidRobotState,
  stepFormSelectors.getOrderedStepIds,
  (
    activeItem,
    initialRobotState,
    robotStateTimeline,
    lastValidRobotState,
    orderedStepIds
  ) => {
    // Add pseudo-frames for start and end terminal items
    const timeline = [
      { robotState: initialRobotState, commands: [] },
      ...robotStateTimeline.timeline,
      { robotState: lastValidRobotState, commands: [] },
    ]
    const lastValidRobotStateIdx = timeline.length - 1
    let timelineIdx = lastValidRobotStateIdx // default to last valid robot state

    let idxAfterStep = orderedStepIds.findIndex(id => id === activeItem.id) + 1
    if (activeItem.isStep && idxAfterStep <= lastValidRobotStateIdx) {
      timelineIdx = idxAfterStep
    } else if (activeItem.id === START_TERMINAL_ITEM_ID) {
      timelineIdx = 0
    }

    assert(
      timelineIdx !== -1,
      `timelineFrameForActiveItem got unhandled terminal id: "${activeItem.id}"`
    )

    return timeline[timelineIdx]
  }
)
