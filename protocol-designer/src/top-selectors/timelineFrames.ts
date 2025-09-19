import { createSelector } from 'reselect'

import { selectors as fileDataSelectors } from '../file-data'
import { selectors as stepFormSelectors } from '../step-forms'
import {
  HARDWARE_ID,
  PRESAVED_STEP_ID,
  START_TERMINAL_ITEM_ID,
} from '../steplist'
import {
  SINGLE_STEP_SELECTION_TYPE,
  TERMINAL_ITEM_SELECTION_TYPE,
} from '../ui/steps/reducers'
import {
  getActiveItem,
  getSelectedStepId,
  getSelectedTerminalItemId,
} from '../ui/steps/selectors'

import type {
  CommandsAndRobotState,
  RobotState,
  Timeline,
} from '@opentrons/step-generation'
import type { TerminalItemId } from '../steplist'
import type { Selector } from '../types'
import type { HoverableItem } from '../ui/steps/reducers'

const _timelineFrameHelper = (beforeActiveItem: boolean) => (
  activeItem: HoverableItem | null,
  initialRobotState: RobotState,
  robotStateTimeline: Timeline,
  lastValidRobotState: RobotState,
  orderedStepIds: string[],
  selectedStepId: string | null,
  selectedTerminalItemId: TerminalItemId | null
): CommandsAndRobotState | null => {
  if (activeItem === null) return null
  // Add pseudo-frames for start and end terminal items
  const timeline = [
    {
      robotState: initialRobotState,
      commands: [],
    },
    ...robotStateTimeline.timeline,
    {
      robotState: lastValidRobotState,
      commands: [],
    },
  ]
  const lastValidRobotStateIdx = timeline.length - 1
  let timelineIdx = lastValidRobotStateIdx // default to last valid robot state

  if (
    activeItem.selectionType === TERMINAL_ITEM_SELECTION_TYPE &&
    activeItem.id === PRESAVED_STEP_ID
  ) {
    // presaved step acts the same whether looking at timeline before or after active item
    timelineIdx = lastValidRobotStateIdx
  } else if (activeItem.id === HARDWARE_ID) {
    if (selectedStepId != null) {
      timelineIdx = Math.min(
        orderedStepIds.findIndex(id => id === selectedStepId),
        lastValidRobotStateIdx
      )
    } else if (selectedTerminalItemId === START_TERMINAL_ITEM_ID) {
      timelineIdx = 0
    } else {
      timelineIdx = lastValidRobotStateIdx
    }
  } else if (beforeActiveItem) {
    if (activeItem.selectionType === SINGLE_STEP_SELECTION_TYPE) {
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

    if (
      activeItem.selectionType === SINGLE_STEP_SELECTION_TYPE &&
      idxAfterStep <= lastValidRobotStateIdx
    ) {
      timelineIdx = idxAfterStep
    } else if (activeItem.id === START_TERMINAL_ITEM_ID) {
      timelineIdx = 0
    }
  }

  console.assert(
    timelineIdx !== -1,
    `timelineFrameForActiveItem got unhandled terminal id: "${activeItem.id}"`
  )
  return timeline[timelineIdx]
}

export const timelineFrameBeforeActiveItem: Selector<CommandsAndRobotState | null> = createSelector(
  getActiveItem,
  fileDataSelectors.getInitialRobotState,
  fileDataSelectors.getRobotStateTimeline,
  fileDataSelectors.lastValidRobotState,
  stepFormSelectors.getOrderedStepIds,
  getSelectedStepId,
  getSelectedTerminalItemId,
  _timelineFrameHelper(true)
)
export const timelineFrameAfterActiveItem: Selector<CommandsAndRobotState | null> = createSelector(
  getActiveItem,
  fileDataSelectors.getInitialRobotState,
  fileDataSelectors.getRobotStateTimeline,
  fileDataSelectors.lastValidRobotState,
  stepFormSelectors.getOrderedStepIds,
  getSelectedStepId,
  getSelectedTerminalItemId,
  _timelineFrameHelper(false)
)
