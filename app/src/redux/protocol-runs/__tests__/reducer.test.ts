import { describe, expect, it } from 'vitest'

import {
  updateRunSetupStepsComplete,
  updateRunSetupStepsRequired,
} from '../actions'
import * as Constants from '../constants'
import { protocolRunReducer } from '../reducer'

import type { CameraState } from '/app/redux/protocol-runs'

describe('protocol runs reducer', () => {
  const SETUP_INTIAL = {
    [Constants.ROBOT_CALIBRATION_STEP_KEY]: {
      required: true,
      complete: false,
    },
    [Constants.MODULE_SETUP_STEP_KEY]: { required: true, complete: false },
    [Constants.LPC_STEP_KEY]: { required: true, complete: false },
    [Constants.LABWARE_SETUP_STEP_KEY]: {
      required: true,
      complete: false,
    },
    [Constants.CAMERA_SETUP_STEP_KEY]: {
      required: true,
      complete: false,
    },
  }
  const CAMERA_INITIAL: CameraState = {
    liveStreamEnabled: true,
    recoveryEnabled: true,
    enabled: true,
  }

  it('establishes an empty state if you tell it one', () => {
    const nextState = protocolRunReducer(
      undefined,
      updateRunSetupStepsComplete('some-run-id', {})
    )
    expect(nextState['some-run-id']?.setup).toEqual(SETUP_INTIAL)
  })
  it('updates complete based on an action', () => {
    const nextState = protocolRunReducer(
      {
        'some-run-id': {
          setup: {
            ...SETUP_INTIAL,
            [Constants.LABWARE_SETUP_STEP_KEY]: {
              complete: true,
              required: true,
            },
          },
          camera: CAMERA_INITIAL,
        },
      },
      updateRunSetupStepsComplete('some-run-id', {
        [Constants.LPC_STEP_KEY]: true,
      })
    )
    expect(nextState['some-run-id']?.setup).toEqual({
      ...SETUP_INTIAL,
      [Constants.LABWARE_SETUP_STEP_KEY]: {
        required: true,
        complete: true,
      },
      [Constants.LPC_STEP_KEY]: { required: true, complete: true },
    })
  })
  it('updates required based on an action', () => {
    const nextState = protocolRunReducer(
      {
        'some-run-id': {
          setup: SETUP_INTIAL,
          camera: CAMERA_INITIAL,
        },
      },
      updateRunSetupStepsRequired('some-run-id', {
        [Constants.LABWARE_SETUP_STEP_KEY]: false,
      })
    )
    expect(nextState['some-run-id']?.setup).toEqual({
      ...SETUP_INTIAL,
      [Constants.LABWARE_SETUP_STEP_KEY]: {
        required: false,
        complete: false,
      },
    })
  })
})
