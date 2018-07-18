// @flow
import {createSelector} from 'reselect'
import type {BaseState} from '../types'

const rootSelector = (state: BaseState) => state.tutorial

export const getHints = createSelector(
  rootSelector,
  tutorial => tutorial.hints
)
