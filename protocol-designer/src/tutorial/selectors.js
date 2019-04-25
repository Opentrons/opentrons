// @flow
import { createSelector } from 'reselect'
import isEmpty from 'lodash/isEmpty'
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

export const getCanClearHintDismissals: Selector<boolean> = createSelector(
  rootSelector,
  tutorial => !isEmpty(tutorial.dismissedHints)
)
