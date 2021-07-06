import { createSelector } from 'reselect'
import { BaseState, Selector } from '../../types'
import { RootState } from '../reducers'
import { FileMetadataFields } from '../types'
export const rootSelector = (state: BaseState): RootState => state.fileData
export const getCurrentProtocolExists: Selector<boolean> = createSelector(
  rootSelector,
  rootState => rootState.currentProtocolExists
)
export const protocolName: Selector<
  FileMetadataFields['protocolName']
> = createSelector(rootSelector, state => state.fileMetadata.protocolName)
export const getFileMetadata: Selector<FileMetadataFields> = createSelector(
  rootSelector,
  state => state.fileMetadata
)
