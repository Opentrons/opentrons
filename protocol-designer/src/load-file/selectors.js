// @flow
import { createSelector } from 'reselect'

import type { BaseState, Selector } from '../types'
import type { RootState } from './reducers'

export const rootSelector = (state: BaseState): RootState => state.loadFile

export const getFileUploadMessages: Selector<
  $PropertyType<RootState, 'fileUploadMessage'>
> = createSelector(
  rootSelector,
  s => s.fileUploadMessage
)

export const getHasUnsavedChanges: Selector<
  $PropertyType<RootState, 'unsavedChanges'>
> = createSelector(
  rootSelector,
  s => s.unsavedChanges
)
