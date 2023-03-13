import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { LEFT } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import {
  MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
  MOVE_PIN_TO_FRONT_JAW,
  REMOVE_PIN_FROM_REAR_JAW,
} from './constants'
import { useCreateRunCommandMutation } from '../../resources/runs/hooks'
import type { GripperWizardStepProps, MovePinStep } from './types'
import type { Coordinates } from '@opentrons/shared-data'

interface MovePinProps extends GripperWizardStepProps, MovePinStep {
  setFrontJawOffset: (offset: Coordinates) => void
  frontJawOffset: Coordinates | null
  createRunCommand: ReturnType<
    typeof useCreateRunCommandMutation
  >['createRunCommand']
}

export const MovePin = (props: MovePinProps): JSX.Element | null => {
  const {
    proceed,
    attachedGripper,
    isRobotMoving,
    goBack,
    movement,
    setFrontJawOffset,
    frontJawOffset,
    createRunCommand,
  } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])
  if (attachedGripper == null) return null

  const handleOnClick = (): void => {
    if (movement === REMOVE_PIN_FROM_REAR_JAW) {
      proceed()
    } else {
      const jaw = movement === MOVE_PIN_TO_FRONT_JAW ? 'front' : 'rear'
      createRunCommand({
        command: {
          commandType: 'home' as const,
          params: {
            axes: [], // TODO: use gripper motor axis const here
          },
        },
        waitUntilComplete: true,
      })
        .then(() => {
          createRunCommand({
            command: {
              // @ts-expect-error(BC, 2022-03-10): this will pass type checks when we update command types from V6 to V7 in shared-data
              commandType: 'calibration/calibrateGripper' as const,
              params:
                jaw === 'rear' && frontJawOffset != null
                  ? { jaw, otherJawOffset: frontJawOffset }
                  : { jaw },
            },
            waitUntilComplete: true,
          })
            .then(({ data }) => {
              if (jaw === 'front' && data?.result?.jawOffset != null) {
                setFrontJawOffset(data.result.jawOffset)
              }
              createRunCommand({
                command: {
                  // @ts-expect-error(BC, 2022-03-10): this will pass type checks when we update command types from V6 to V7 in shared-data
                  commandType: 'calibration/moveToMaintenancePosition' as const,
                  params: {
                    mount: LEFT, // TODO: update to gripper mount when RLAB-231 is addressed
                  },
                },
                waitUntilComplete: true,
              })
                .then(() => {
                  proceed()
                })
                .catch()
            })
            .catch()
        })
        .catch()
    }
  }
  const infoByMovement: {
    [m in typeof movement]: {
      inProgressText: string
      header: string
      body: React.ReactNode
      buttonText: string
      image: React.ReactNode
    }
  } = {
    [MOVE_PIN_TO_FRONT_JAW]: {
      inProgressText: t('stand_back_gripper_is_calibrating'),
      header: t('insert_pin_into_front_jaw'),
      body: t('move_pin_from_storage_to_front_jaw'),
      buttonText: t('begin_calibration'),
      image: (
        <StyledText>
          TODO image of moving pin from storage to front jaw
        </StyledText>
      ),
    },
    [MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW]: {
      inProgressText: t('stand_back_gripper_is_calibrating'),
      header: t('insert_pin_into_rear_jaw'),
      body: t('move_pin_from_front_to_rear_jaw'),
      buttonText: t('shared:continue'),
      image: (
        <StyledText>TODO image of moving pin from front to rear jaw</StyledText>
      ),
    },
    [REMOVE_PIN_FROM_REAR_JAW]: {
      inProgressText: t('shared:stand_back_robot_is_in_motion'),
      header: t('remove_calibration_pin'),
      body: t('move_pin_from_rear_jaw_to_storage'),
      buttonText: t('complete_calibration'),
      image: <StyledText>TODO image of storing pin</StyledText>,
    },
  }

  const { inProgressText, header, body, buttonText, image } = infoByMovement[
    movement
  ]
  if (isRobotMoving) return <InProgressModal description={inProgressText} />
  return (
    <GenericWizardTile
      header={header}
      rightHandBody={image}
      bodyText={<StyledText as="p">{body}</StyledText>}
      proceedButtonText={buttonText}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
