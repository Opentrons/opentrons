import { describe, expect, it } from 'vitest'

import {
  GRIPPER_FLOW_TYPES,
  MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
  MOVE_PIN_TO_FRONT_JAW,
  REMOVE_PIN_FROM_REAR_JAW,
  SECTIONS,
  SUCCESSFULLY_ATTACHED,
  SUCCESSFULLY_ATTACHED_AND_CALIBRATED,
  SUCCESSFULLY_CALIBRATED,
  SUCCESSFULLY_DETACHED,
} from '../constants'
import { getGripperWizardSteps } from '../getGripperWizardSteps'

describe('getGripperWizardSteps', () => {
  it('inserts SELECT_SLOT before the first MOVE_PIN for recalibrate', () => {
    expect(getGripperWizardSteps(GRIPPER_FLOW_TYPES.RECALIBRATE)).toStrictEqual(
      [
        { section: SECTIONS.BEFORE_BEGINNING },
        { section: SECTIONS.SELECT_SLOT },
        { section: SECTIONS.MOVE_PIN, movement: MOVE_PIN_TO_FRONT_JAW },
        {
          section: SECTIONS.MOVE_PIN,
          movement: MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
        },
        { section: SECTIONS.MOVE_PIN, movement: REMOVE_PIN_FROM_REAR_JAW },
        {
          section: SECTIONS.SUCCESS,
          successfulAction: SUCCESSFULLY_CALIBRATED,
        },
      ]
    )
  })

  it('inserts SELECT_SLOT before the first MOVE_PIN for attach', () => {
    expect(getGripperWizardSteps(GRIPPER_FLOW_TYPES.ATTACH)).toStrictEqual([
      { section: SECTIONS.BEFORE_BEGINNING },
      { section: SECTIONS.MOUNT_GRIPPER },
      { section: SECTIONS.FIRMWARE_UPDATE },
      { section: SECTIONS.SUCCESS, successfulAction: SUCCESSFULLY_ATTACHED },
      { section: SECTIONS.SELECT_SLOT },
      { section: SECTIONS.MOVE_PIN, movement: MOVE_PIN_TO_FRONT_JAW },
      {
        section: SECTIONS.MOVE_PIN,
        movement: MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
      },
      { section: SECTIONS.MOVE_PIN, movement: REMOVE_PIN_FROM_REAR_JAW },
      {
        section: SECTIONS.SUCCESS,
        successfulAction: SUCCESSFULLY_ATTACHED_AND_CALIBRATED,
      },
    ])
  })

  it('does not add SELECT_SLOT for detach', () => {
    expect(getGripperWizardSteps(GRIPPER_FLOW_TYPES.DETACH)).toStrictEqual([
      { section: SECTIONS.BEFORE_BEGINNING },
      { section: SECTIONS.UNMOUNT_GRIPPER },
      { section: SECTIONS.SUCCESS, successfulAction: SUCCESSFULLY_DETACHED },
    ])
  })
})
