import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { LEFT } from '@opentrons/shared-data'
import { COLORS, TYPOGRAPHY } from '@opentrons/components'
import { css } from 'styled-components'
import { StyledText } from '../../atoms/text'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import {
  MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
  MOVE_PIN_TO_FRONT_JAW,
  REMOVE_PIN_FROM_REAR_JAW,
} from './constants'
import movePinStorageToFront from '../../assets/videos/gripper-wizards/PIN_FROM_STORAGE_TO_FRONT_JAW.webm'
import movePinFrontToRear from '../../assets/videos/gripper-wizards/PIN_FROM_FRONT_TO_REAR_JAW.webm'
import movePinRearToStorage from '../../assets/videos/gripper-wizards/PIN_FROM_REAR_TO_STORAGE.webm'
import calibratingFrontJaw from '../../assets/videos/gripper-wizards/CALIBRATING_FRONT_JAW.webm'
import calibratingRearJaw from '../../assets/videos/gripper-wizards/CALIBRATING_REAR_JAW.webm'

import type { Coordinates } from '@opentrons/shared-data'
import type { CreateMaintenaceCommand } from '../../resources/runs/hooks'
import type { GripperWizardStepProps, MovePinStep } from './types'

interface MovePinProps extends GripperWizardStepProps, MovePinStep {
  setFrontJawOffset: (offset: Coordinates) => void
  frontJawOffset: Coordinates | null
  createRunCommand: CreateMaintenaceCommand
}

export const MovePin = (props: MovePinProps): JSX.Element | null => {
  const {
    proceed,
    isRobotMoving,
    goBack,
    movement,
    setFrontJawOffset,
    frontJawOffset,
    createRunCommand,
    errorMessage,
    setErrorMessage,
  } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])

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
        .then(({ data }) => {
          if (data.status === 'failed') {
            setErrorMessage(data.error?.detail ?? null)
          }
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
              if (data.status === 'failed') {
                setErrorMessage(data.error?.detail ?? null)
              }
              if (jaw === 'front' && data?.result?.jawOffset != null) {
                setFrontJawOffset(data.result.jawOffset)
              }
              createRunCommand({
                command: {
                  // @ts-expect-error(BC, 2022-03-10): this will pass type checks when we update command types from V6 to V7 in shared-data
                  commandType: 'calibration/moveToMaintenancePosition' as const,
                  params: {
                    mount: LEFT,
                  },
                },
                waitUntilComplete: true,
              })
                .then(({ data }) => {
                  if (data.status === 'failed') {
                    setErrorMessage(data.error?.detail ?? null)
                  }
                  proceed()
                })
                .catch(error => setErrorMessage(error.message))
            })
            .catch(error => setErrorMessage(error.message))
        })
        .catch(error => setErrorMessage(error.message))
    }
  }
  const infoByMovement: {
    [m in typeof movement]: {
      inProgressText: string
      header: string
      body: React.ReactNode
      buttonText: string
      prepImage: React.ReactNode
      inProgressImage?: React.ReactNode
    }
  } = {
    [MOVE_PIN_TO_FRONT_JAW]: {
      inProgressText: t('stand_back_gripper_is_calibrating'),
      inProgressImage: (
        <video
          css={css`
            max-width: 100%;
            max-height: 20rem;
          `}
          autoPlay={true}
          loop={true}
          controls={false}
          aria-label="calibrating front jaw"
        >
          <source src={calibratingFrontJaw} />
        </video>
      ),
      header: t('insert_pin_into_front_jaw'),
      body: t('move_pin_from_storage_to_front_jaw'),
      buttonText: t('begin_calibration'),
      prepImage: (
        <video
          css={css`
            max-width: 100%;
            max-height: 20rem;
          `}
          autoPlay={true}
          loop={true}
          controls={false}
          aria-label="move calibration pin from storage location to front jaw"
        >
          <source src={movePinStorageToFront} />
        </video>
      ),
    },
    [MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW]: {
      inProgressText: t('stand_back_gripper_is_calibrating'),
      inProgressImage: (
        <video
          css={css`
            max-width: 100%;
            max-height: 20rem;
          `}
          autoPlay={true}
          loop={true}
          controls={false}
          aria-label="calibrating rear jaw"
        >
          <source src={calibratingRearJaw} />
        </video>
      ),
      header: t('insert_pin_into_rear_jaw'),
      body: t('move_pin_from_front_to_rear_jaw'),
      buttonText: t('continue'),
      prepImage: (
        <video
          css={css`
            max-width: 100%;
            max-height: 20rem;
          `}
          autoPlay={true}
          loop={true}
          controls={false}
          aria-label="move calibration pin from front jaw to rear jaw"
        >
          <source src={movePinFrontToRear} />
        </video>
      ),
    },
    [REMOVE_PIN_FROM_REAR_JAW]: {
      inProgressText: t('shared:stand_back_robot_is_in_motion'),
      header: t('remove_calibration_pin'),
      body: t('move_pin_from_rear_jaw_to_storage'),
      buttonText: t('complete_calibration'),
      prepImage: (
        <video
          css={css`
            max-width: 100%;
            max-height: 20rem;
          `}
          autoPlay={true}
          loop={true}
          controls={false}
          aria-label="move calibration rear jaw to storage"
        >
          <source src={movePinRearToStorage} />
        </video>
      ),
    },
  }

  const {
    inProgressText,
    header,
    body,
    buttonText,
    prepImage,
    inProgressImage,
  } = infoByMovement[movement]
  if (isRobotMoving)
    return (
      <InProgressModal
        description={
          errorMessage == null
            ? inProgressText
            : t('shared:stand_back_robot_is_in_motion')
        }
        alternativeSpinner={errorMessage == null ? inProgressImage : undefined}
      />
    )
  return errorMessage != null ? (
    <SimpleWizardBody
      isSuccess={false}
      iconColor={COLORS.errorEnabled}
      header={t('shared:error_encountered')}
      subHeader={
        <Trans
          t={t}
          i18nKey={'return_pin_error'}
          values={{ error: errorMessage }}
          components={{
            block: <StyledText as="p" />,
            bold: (
              <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold} />
            ),
          }}
        />
      }
    />
  ) : (
    <GenericWizardTile
      header={header}
      rightHandBody={prepImage}
      bodyText={<StyledText as="p">{body}</StyledText>}
      proceedButtonText={buttonText}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
