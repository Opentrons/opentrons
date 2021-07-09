import { createSelector } from 'reselect'
import { BaseState, Selector } from '../types'
import { RootState } from './reducers'
export const rootSelector = (state: BaseState): RootState => state.loadFile
export const getFileUploadMessages: Selector<
  RootState['fileUploadMessage']
> = createSelector(rootSelector, s => s.fileUploadMessage)
export const getHasUnsavedChanges: Selector<
  RootState['unsavedChanges']
> = createSelector(rootSelector, s => s.unsavedChanges)
