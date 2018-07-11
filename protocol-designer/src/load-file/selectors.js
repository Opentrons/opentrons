// @flow
import {createSelector} from 'reselect'
import type {BaseState, Selector} from '../types'
import type {RootState} from './reducers'

export const rootSelector = (state: BaseState): RootState => state.loadFile

export const getFileLoadErrors: Selector<$PropertyType<RootState, 'fileErrors'>> = createSelector(
  rootSelector,
  s => s.fileErrors
)

export const hasUnsavedChanges: Selector<$PropertyType<RootState, 'unsavedChanges'>> = createSelector(
  rootSelector,
  s => s.unsavedChanges
)
