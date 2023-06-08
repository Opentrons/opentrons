import { createSelector } from 'reselect'
import { BaseState, Selector } from '../../types'
import { RootState } from '../reducers'
import { FileMetadataFields } from '../types'
import type { RobotType } from '@opentrons/shared-data'
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

export const getRobotType: Selector<RobotType> = createSelector(rootSelector, state => state.robotType)


