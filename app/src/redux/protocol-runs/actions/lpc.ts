import {
  APPLIED_OFFSETS_TO_RUN,
  APPLY_WORKING_OFFSETS,
  CLEAR_SNACKBAR_STATUS,
  CLEAR_WORKING_OFFSETS,
  FINISH_LPC,
  GO_BACK_HANDLE_LW_SUBSTEP,
  GO_BACK_LAST_STEP,
  PROCEED_HANDLE_LW_SUBSTEP,
  PROCEED_STEP,
  RESET_OFFSET_TO_DEFAULT,
  SET_FINAL_POSITION,
  SET_INITIAL_POSITION,
  SET_SELECTED_LABWARE,
  SET_SELECTED_LABWARE_URI,
  SOURCE_OFFSETS_FROM_DATABASE,
  SOURCE_OFFSETS_FROM_RUN,
  TOGGLE_DEFAULT_OFFSET_INFO_BANNER,
  UPDATE_CONFLICT_TIMESTAMP,
  UPDATE_LPC,
  UPDATE_LPC_DECK,
  UPDATE_LPC_LABWARE,
} from '../constants'

import type { DeckConfiguration } from '@opentrons/shared-data'
import type {
  AppliedOffsetsToRunAction,
  ApplyWorkingOffsetsAction,
  ClearSelectedLabwareWorkingOffsetsAction,
  ClearSnackbarStatus,
  ConflictTimestampInfo,
  FinalPositionAction,
  FinishLPCAction,
  GoBackHandleLwSubstepAction,
  GoBackStepAction,
  InitialPositionAction,
  LocationSpecificOffsetLocationDetails,
  LPCLabwareInfo,
  LPCStep,
  LPCWizardState,
  OffsetLocationDetails,
  PositionParams,
  ProceedHandleLwSubstepAction,
  ProceedStepAction,
  ResetLocationSpecificOffsetToDefaultAction,
  SavedOffsets,
  SelectedLabwareAction,
  SelectedLabwareNameAction,
  SourceOffsetsFromDatabaseAction,
  SourceOffsetsFromRunAction,
  ToggleDefaultOffsetInfoBanner,
  UpdateConflictTimestampAction,
  UpdateLPCAction,
  UpdateLPCDeckAction,
  UpdateLPCLabwareAction,
} from '../types'

export const proceedStep = (
  runId: string,
  toStep?: LPCStep
): ProceedStepAction => ({
  type: PROCEED_STEP,
  payload: { runId, toStep },
})

export const goBackLastStep = (runId: string): GoBackStepAction => ({
  type: GO_BACK_LAST_STEP,
  payload: { runId },
})

export const setSelectedLabwareUri = (
  runId: string,
  labwareUri: string
): SelectedLabwareNameAction => ({
  type: SET_SELECTED_LABWARE_URI,
  payload: {
    runId,
    labwareUri,
  },
})

export const setSelectedLabware = (
  runId: string,
  labwareUri: string,
  location: OffsetLocationDetails | null
): SelectedLabwareAction => ({
  type: SET_SELECTED_LABWARE,
  payload: {
    runId,
    labwareUri,
    location,
  },
})

export const setInitialPosition = (
  runId: string,
  params: PositionParams
): InitialPositionAction => ({
  type: SET_INITIAL_POSITION,
  payload: { ...params, runId },
})

export const setFinalPosition = (
  runId: string,
  isOnDevice: boolean,
  params: PositionParams
): FinalPositionAction => ({
  type: SET_FINAL_POSITION,
  payload: { ...params, runId, isOnDevice },
})

export const resetLocationSpecificOffsetToDefault = (
  runId: string,
  labwareUri: string,
  location: LocationSpecificOffsetLocationDetails
): ResetLocationSpecificOffsetToDefaultAction => ({
  type: RESET_OFFSET_TO_DEFAULT,
  payload: { runId, labwareUri, location },
})

export const clearSelectedLabwareWorkingOffsets = (
  runId: string,
  labwareUri: string
): ClearSelectedLabwareWorkingOffsetsAction => ({
  type: CLEAR_WORKING_OFFSETS,
  payload: { runId, labwareUri },
})

export const applyWorkingOffsets = (
  runId: string,
  saveResult: SavedOffsets
): ApplyWorkingOffsetsAction => ({
  type: APPLY_WORKING_OFFSETS,
  payload: { runId, saveResult },
})

export const updateLPC = (
  runId: string,
  state: LPCWizardState
): UpdateLPCAction => ({
  type: UPDATE_LPC,
  payload: { runId, state },
})

export const updateLPCDeck = (
  runId: string,
  deck: DeckConfiguration
): UpdateLPCDeckAction => ({
  type: UPDATE_LPC_DECK,
  payload: { runId, deck },
})

export const updateLPCLabware = (
  runId: string,
  labware: LPCLabwareInfo['labware']
): UpdateLPCLabwareAction => ({
  type: UPDATE_LPC_LABWARE,
  payload: { runId, labware },
})

export const closeLPC = (runId: string): FinishLPCAction => ({
  type: FINISH_LPC,
  payload: { runId },
})

export const proceedEditOffsetSubstep = (
  runId: string,
  isDesktop?: boolean
): ProceedHandleLwSubstepAction => ({
  type: PROCEED_HANDLE_LW_SUBSTEP,
  payload: { runId, isDesktop },
})

export const goBackEditOffsetSubstep = (
  runId: string
): GoBackHandleLwSubstepAction => ({
  type: GO_BACK_HANDLE_LW_SUBSTEP,
  payload: { runId },
})

export const appliedOffsetsToRun = (
  runId: string
): AppliedOffsetsToRunAction => ({
  type: APPLIED_OFFSETS_TO_RUN,
  payload: { runId },
})

export const sourceOffsetsFromRun = (
  runId: string
): SourceOffsetsFromRunAction => ({
  type: SOURCE_OFFSETS_FROM_RUN,
  payload: { runId },
})

export const sourceOffsetsFromDatabase = (
  runId: string
): SourceOffsetsFromDatabaseAction => ({
  type: SOURCE_OFFSETS_FROM_DATABASE,
  payload: { runId },
})

export const updateConflictTimestamp = (
  runId: string,
  info: ConflictTimestampInfo
): UpdateConflictTimestampAction => ({
  type: UPDATE_CONFLICT_TIMESTAMP,
  payload: { runId, info },
})

export const toggleDefaultOffsetInfoBanner = (
  runId: string
): ToggleDefaultOffsetInfoBanner => ({
  type: TOGGLE_DEFAULT_OFFSET_INFO_BANNER,
  payload: { runId },
})

export const clearSnackbarStatus = (runId: string): ClearSnackbarStatus => ({
  type: CLEAR_SNACKBAR_STATUS,
  payload: { runId },
})
