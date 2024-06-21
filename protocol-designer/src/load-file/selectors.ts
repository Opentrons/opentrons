import { createSelector } from 'reselect'
import type { BaseState, Selector } from '../types'
import type { RootState } from './reducers'
export const rootSelector = (state: BaseState): RootState => state.loadFile
export const getFileUploadMessages: Selector<
  RootState['fileUploadMessage']
> = createSelector(rootSelector, s => s.fileUploadMessage)
export const getHasUnsavedChanges: Selector<
  RootState['unsavedChanges']
> = createSelector(rootSelector, s => s.unsavedChanges)
export const getHasNativeFileSystemAccess: Selector<
  RootState['hasNativeFileSystemAccess']
> = createSelector(rootSelector, s => s.hasNativeFileSystemAccess)
