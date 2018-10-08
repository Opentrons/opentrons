// @flow
import {createSelector} from 'reselect'
import type {BaseState} from '../types'

const rootSelector = (state: BaseState) => state.tutorial

export const getHint = createSelector(
  rootSelector,
  tutorial => {
    const dismissedKeys = Object.keys(tutorial.dismissedHints)
    const hints = tutorial.hints.filter(hintKey => !dismissedKeys.includes(hintKey))

    // TODO: Ian 2018-10-08 ordering of multiple hints is TBD.
    // For now, show 1 non-dismissed hint at a time
    return hints[0]
  }
)
