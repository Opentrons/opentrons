import { createReducer, isAnyOf } from '@reduxjs/toolkit'

import {
  updateCameraEnablement,
  updateCameraRecoveryEnablement,
  updateCameraSpecificSettings,
  updateCameraStreamEnablement,
  updateCameraUsageSettings,
  updateRunSetupStepsComplete,
  updateRunSetupStepsRequired,
} from '../actions'
import * as Constants from '../constants'

import type { RunSetupStatus } from '../types'

const INITIAL_SETUP_STEP_STATE = {
  required: true,
  complete: false,
}
const CAMERA_INITIAL_SETUP_STATE = {
  ...INITIAL_SETUP_STEP_STATE,
  cameraEnabled: false,
  liveStreamEnabled: false,
  recoveryEnabled: false,
  cameraImageSettings: {
    ot_system_camera: {},
  },
}

export const INITIAL_RUN_SETUP_STATE: RunSetupStatus = {
  [Constants.ROBOT_CALIBRATION_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
  [Constants.MODULE_SETUP_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
  [Constants.LPC_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
  [Constants.LABWARE_SETUP_STEP_KEY]: INITIAL_SETUP_STEP_STATE,
  [Constants.CAMERA_SETUP_STEP_KEY]: CAMERA_INITIAL_SETUP_STATE,
}

export const setupReducer = createReducer(INITIAL_RUN_SETUP_STATE, builder => {
  builder
    .addCase(updateRunSetupStepsComplete, (state, { payload }) => {
      Constants.SETUP_STEP_KEYS.forEach(step => {
        const complete = payload.complete[step]
        if (complete != null) {
          state[step].complete = complete
        }
      })
    })
    .addCase(updateRunSetupStepsRequired, (state, { payload }) => {
      Constants.SETUP_STEP_KEYS.forEach(step => {
        const required = payload.required[step]
        if (required != null) {
          state[step].required = required
        }
      })
    })
    .addCase(updateCameraSpecificSettings, (state, { payload }) => {
      state[Constants.CAMERA_SETUP_STEP_KEY].cameraImageSettings[
        payload.cameraId
      ] = payload.cameraImageSettings
    })
    .addMatcher(
      isAnyOf(
        updateCameraEnablement,
        updateCameraRecoveryEnablement,
        updateCameraStreamEnablement,
        updateCameraUsageSettings
      ),
      (state, action) => {
        const { runId, ...rest } = action.payload
        Object.assign(state[Constants.CAMERA_SETUP_STEP_KEY], rest)
      }
    )
})
