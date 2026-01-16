import { describe, expect, it } from 'vitest'

import {
  updateRunSetupStepsComplete,
  updateRunSetupStepsRequired,
} from '../actions'
import * as Constants from '../constants'
import { protocolRunReducer } from '../reducer'

const BASE_STEP = {
  required: true,
  complete: false,
}

const CAMERA_STEP = {
  required: true,
  complete: false,
  cameraEnabled: false,
  liveStreamEnabled: false,
  recoveryEnabled: false,
  cameraImageSettings: {
    ot_system_camera: {},
  },
}

describe('protocol runs reducer', () => {
  const SETUP_INITIAL = {
    [Constants.ROBOT_CALIBRATION_STEP_KEY]: { ...BASE_STEP },
    [Constants.MODULE_SETUP_STEP_KEY]: { ...BASE_STEP },
    [Constants.LPC_STEP_KEY]: { ...BASE_STEP },
    [Constants.LABWARE_SETUP_STEP_KEY]: { ...BASE_STEP },
    [Constants.CAMERA_SETUP_STEP_KEY]: { ...CAMERA_STEP },
  }

  it('establishes an empty state if you tell it one', () => {
    const nextState = protocolRunReducer(
      undefined,
      updateRunSetupStepsComplete('some-run-id', {})
    )
    expect(nextState['some-run-id']?.setup).toEqual(SETUP_INITIAL)
  })

  it('updates complete based on an action', () => {
    const nextState = protocolRunReducer(
      {
        'some-run-id': {
          setup: {
            ...SETUP_INITIAL,
            [Constants.LABWARE_SETUP_STEP_KEY]: {
              required: true,
              complete: true,
            },
          },
        },
      },
      updateRunSetupStepsComplete('some-run-id', {
        [Constants.LPC_STEP_KEY]: true,
      })
    )

    expect(nextState['some-run-id']?.setup).toEqual({
      ...SETUP_INITIAL,
      [Constants.LABWARE_SETUP_STEP_KEY]: {
        required: true,
        complete: true,
      },
      [Constants.LPC_STEP_KEY]: {
        required: true,
        complete: true,
      },
    })
  })

  it('updates required based on an action', () => {
    const nextState = protocolRunReducer(
      {
        'some-run-id': {
          setup: SETUP_INITIAL,
        },
      },
      updateRunSetupStepsRequired('some-run-id', {
        [Constants.LABWARE_SETUP_STEP_KEY]: false,
      })
    )

    expect(nextState['some-run-id']?.setup).toEqual({
      ...SETUP_INITIAL,
      [Constants.LABWARE_SETUP_STEP_KEY]: {
        required: false,
        complete: false,
      },
    })
  })
})
