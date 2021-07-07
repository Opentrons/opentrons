import { Reducer, combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import { Timeline } from '@opentrons/step-generation'
import { Action } from '../../types'
import { FileMetadataFields, SaveFileMetadataAction } from '../types'
import { LoadFileAction, NewProtocolFields } from '../../load-file'
import { ComputeRobotStateTimelineSuccessAction } from '../actions'
import { Substeps } from '../../steplist/types'
export const timelineIsBeingComputed: Reducer<boolean, any> = handleActions(
  {
    COMPUTE_ROBOT_STATE_TIMELINE_REQUEST: () => true,
    COMPUTE_ROBOT_STATE_TIMELINE_SUCCESS: () => false,
  },
  false
)
// @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
export const computedRobotStateTimeline: Reducer<Timeline, any> = handleActions(
  {
    // @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
    COMPUTE_ROBOT_STATE_TIMELINE_SUCCESS: (
      state,
      action: ComputeRobotStateTimelineSuccessAction
    ) => action.payload.standardTimeline,
  },
  {
    timeline: [],
  }
)
export const computedSubsteps: Reducer<Substeps, any> = handleActions(
  {
    // @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
    // TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
    COMPUTE_ROBOT_STATE_TIMELINE_SUCCESS: (
      state,
      action: ComputeRobotStateTimelineSuccessAction
    ) => action.payload.substeps,
  },
  {}
)
const defaultFields = {
  protocolName: '',
  author: '',
  description: '',
}

const updateMetadataFields = (
  state: FileMetadataFields,
  action: LoadFileAction
): FileMetadataFields => {
  const { file } = action.payload
  return file.metadata
}

// track if a protocol has been created or loaded
const currentProtocolExists = handleActions(
  {
    LOAD_FILE: () => true,
    CREATE_NEW_PROTOCOL: () => true,
  },
  false
)

function newProtocolMetadata(
  state: FileMetadataFields,
  action: {
    payload: NewProtocolFields
  }
): FileMetadataFields {
  return {
    ...defaultFields,
    protocolName: action.payload.name || '',
    created: Date.now(),
    lastModified: null,
  }
}
// @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const fileMetadata = handleActions(
  {
    LOAD_FILE: updateMetadataFields,
    CREATE_NEW_PROTOCOL: newProtocolMetadata,
    SAVE_FILE_METADATA: (
      state: FileMetadataFields,
      action: SaveFileMetadataAction
    ): FileMetadataFields => ({ ...state, ...action.payload }),
    SAVE_PROTOCOL_FILE: (state: FileMetadataFields): FileMetadataFields => {
      // NOTE: 'last-modified' is updated "on-demand", in response to user clicking "save/export"
      return { ...state, lastModified: Date.now() }
    },
  },
  defaultFields
)
export interface RootState {
  computedRobotStateTimeline: Timeline
  computedSubsteps: Substeps
  currentProtocolExists: boolean
  fileMetadata: FileMetadataFields
  timelineIsBeingComputed: boolean
}
const _allReducers = {
  computedRobotStateTimeline,
  computedSubsteps,
  currentProtocolExists,
  fileMetadata,
  timelineIsBeingComputed,
}
export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _allReducers
)
