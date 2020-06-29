// @flow
import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import isEmpty from 'lodash/isEmpty'
import { createSelector } from 'reselect'

import { getUnsavedForm } from '../step-forms/selectors'
import { timelineFrameBeforeActiveItem } from '../top-selectors/timelineFrames'
import type { BaseState, Selector } from '../types'
import type { HintKey } from '.'

const rootSelector = (state: BaseState) => state.tutorial

export const getHint: Selector<?HintKey> = createSelector(
  rootSelector,
  tutorial => {
    const dismissedKeys = Object.keys(tutorial.dismissedHints)
    const hints = tutorial.hints.filter(
      hintKey => !dismissedKeys.includes(hintKey)
    )

    // TODO: Ian 2018-10-08 ordering of multiple hints is TBD.
    // For now, show 1 non-dismissed hint at a time
    return hints[0]
  }
)

export const getDismissedHints: Selector<Array<HintKey>> = createSelector(
  rootSelector,
  tutorial => {
    const dismissedKeys = Object.keys(tutorial.dismissedHints)
    return dismissedKeys
  }
)

export const getCanClearHintDismissals: Selector<boolean> = createSelector(
  rootSelector,
  tutorial => !isEmpty(tutorial.dismissedHints)
)

export const shouldShowCoolingHint: Selector<boolean> = createSelector(
  timelineFrameBeforeActiveItem,
  getUnsavedForm,
  (prevTimelineFrame, unsavedForm) => {
    if (unsavedForm?.stepType !== 'thermocycler') {
      return false
    }

    const { moduleId } = unsavedForm
    const prevModuleState =
      prevTimelineFrame.robotState.modules[moduleId]?.moduleState
    if (prevModuleState && prevModuleState.type === THERMOCYCLER_MODULE_TYPE) {
      const prevLidTemp = prevModuleState.lidTargetTemp
      const nextLidTemp = unsavedForm.lidTargetTemp
      if (prevLidTemp === null || nextLidTemp === null) return false
      return nextLidTemp < prevLidTemp
    } else {
      console.error('expected thermocycler module')
    }
    return false
  }
)
