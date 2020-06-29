// @flow
import { createSelector } from 'reselect'

import type { BaseState, Selector } from '../../types'
import type { RootState } from '../reducers'
import type { FileMetadataFields } from '../types'

export const rootSelector = (state: BaseState): RootState => state.fileData

export const getCurrentProtocolExists: Selector<boolean> = createSelector(
  rootSelector,
  rootState => rootState.currentProtocolExists
)

export const protocolName: Selector<
  $PropertyType<FileMetadataFields, 'protocolName'>
> = createSelector(
  rootSelector,
  state => state.fileMetadata.protocolName
)

export const getFileMetadata: Selector<FileMetadataFields> = createSelector(
  rootSelector,
  state => state.fileMetadata
)
