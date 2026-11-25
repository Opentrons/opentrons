import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  AnimationVideo,
  COLORS,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { EXTENSION } from '@opentrons/shared-data'

import calibratingFrontJaw from '/app/assets/videos/gripper-wizards/CALIBRATING_FRONT_JAW.webm'
import calibratingRearJaw from '/app/assets/videos/gripper-wizards/CALIBRATING_REAR_JAW.webm'
import movePinFrontToRear from '/app/assets/videos/gripper-wizards/PIN_FROM_FRONT_TO_REAR_JAW.webm'
import movePinRearToStorage from '/app/assets/videos/gripper-wizards/PIN_FROM_REAR_TO_STORAGE.webm'
import movePinStorageToFront from '/app/assets/videos/gripper-wizards/PIN_FROM_STORAGE_TO_FRONT_JAW.webm'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import {
  MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
  MOVE_PIN_TO_FRONT_JAW,
  REMOVE_PIN_FROM_REAR_JAW,
} from './constants'

import type { ReactNode } from 'react'
import type { Vector3D } from '@opentrons/shared-data'
import type { CreateMaintenanceCommand } from '/app/resources/runs'
import type { CalibrationDeckSlot } from '../PipetteWizardFlows/types'
import type { GripperWizardStepProps, MovePinStep } from './types'

interface CalibrateGripperJawParams {
  maintenanceRunId: string
  createRunCommand: CreateMaintenanceCommand
  setErrorMessage: (message: string | null) => void
  proceed: () => void
  jaw: 'front' | 'rear'
  selectedSlot: CalibrationDeckSlot
  frontJawOffset: Vector3D | null
  setFrontJawOffset: (offset: Vector3D) => void
}

export function calibrateGripperJaw({
  maintenanceRunId,
  createRunCommand,
  setErrorMessage,
  proceed,
  jaw,
  selectedSlot,
  frontJawOffset,
  setFrontJawOffset,
}: CalibrateGripperJawParams): void {
  createRunCommand({
    maintenanceRunId,
    command: {
      commandType: 'home' as const,
      params: {
        axes: ['extensionZ', 'extensionJaw'],
      },
    },
    waitUntilComplete: true,
  })
    .then(({ data }) => {
      if (data.status === 'failed') {
        setErrorMessage(data.error?.detail ?? null)
      }
      createRunCommand({
        maintenanceRunId,
        command: {
          commandType: 'home' as const,
          params: {
            skipIfMountPositionOk: 'extension',
          },
        },
        waitUntilComplete: true,
      })
        .then(({ data }) => {
          createRunCommand({
            maintenanceRunId,
            command: {
              commandType: 'calibration/calibrateGripper' as const,
              params:
                jaw === 'rear' && frontJawOffset != null
                  ? {
                      jaw,
                      otherJawOffset: frontJawOffset,
                      slot: selectedSlot,
                    }
                  : { jaw, slot: selectedSlot },
            },
            waitUntilComplete: true,
          })
            .then(({ data }) => {
              if (data.status === 'failed') {
                setErrorMessage(data.error?.detail ?? null)
              }
              if (jaw === 'front' && data?.result?.jawOffset != null) {
                setFrontJawOffset(data.result.jawOffset as Vector3D)
              }
              createRunCommand({
                maintenanceRunId,
                command: {
                  commandType: 'calibration/moveToMaintenancePosition' as const,
                  params: {
                    mount: EXTENSION,
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
                .catch((error: Error) => {
                  setErrorMessage(error.message)
                })
            })
            .catch((error: Error) => {
              setErrorMessage(error.message)
            })
        })
        .catch((error: Error) => {
          setErrorMessage(error.message)
        })
    })
    .catch((error: Error) => {
      setErrorMessage(error.message)
    })
}

interface MovePinProps extends GripperWizardStepProps, MovePinStep {
  setFrontJawOffset: (offset: Vector3D) => void
  frontJawOffset: Vector3D | null
  isExiting: boolean
  createRunCommand: CreateMaintenanceCommand
}

export const MovePin = (props: MovePinProps): JSX.Element | null => {
  const {
    proceed,
    isRobotMoving,
    goBack,
    movement,
    setFrontJawOffset,
    maintenanceRunId,
    frontJawOffset,
    createRunCommand,
    errorMessage,
    setErrorMessage,
    isExiting,
    selectedSlot,
  } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])

  const handleOnClick = (): void => {
    if (
      movement === REMOVE_PIN_FROM_REAR_JAW ||
      movement === MOVE_PIN_TO_FRONT_JAW
    ) {
      proceed()
    } else if (maintenanceRunId != null) {
      calibrateGripperJaw({
        maintenanceRunId,
        createRunCommand,
        setErrorMessage,
        proceed,
        jaw: 'rear',
        selectedSlot,
        frontJawOffset,
        setFrontJawOffset,
      })
    }
  }
  const infoByMovement: {
    [m in typeof movement]: {
      inProgressText: string
      header: string
      body: ReactNode
      buttonText: string
      prepImage: ReactNode
      inProgressImage?: ReactNode
    }
  } = {
    [MOVE_PIN_TO_FRONT_JAW]: {
      inProgressText: t('stand_back_gripper_is_calibrating'),
      inProgressImage: (
        <Flex height="10.2rem" paddingTop={SPACING.spacing4}>
          <AnimationVideo
            css={css`
              max-width: 100%;
              max-height: 100%;
            `}
            aria-label="calibrating front jaw"
          >
            <source src={calibratingFrontJaw} />
          </AnimationVideo>
        </Flex>
      ),
      header: t('insert_pin_into_front_jaw'),
      body: t('move_pin_from_storage_to_front_jaw'),
      buttonText: t('continue'),
      prepImage: (
        <AnimationVideo
          css={css`
            max-width: 100%;
            max-height: 20rem;
          `}
          aria-label="move calibration pin from storage location to front jaw"
        >
          <source src={movePinStorageToFront} />
        </AnimationVideo>
      ),
    },
    [MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW]: {
      inProgressText: t('stand_back_gripper_is_calibrating'),
      inProgressImage: (
        <Flex height="10.2rem" paddingTop={SPACING.spacing4}>
          <AnimationVideo
            css={css`
              max-width: 100%;
              max-height: 100%;
            `}
            aria-label="calibrating rear jaw"
          >
            <source src={calibratingRearJaw} />
          </AnimationVideo>
        </Flex>
      ),
      header: t('insert_pin_into_rear_jaw'),
      body: t('move_pin_from_front_to_rear_jaw'),
      buttonText: t('continue_calibration'),
      prepImage: (
        <AnimationVideo
          css={css`
            max-width: 100%;
            max-height: 20rem;
          `}
          aria-label="move calibration pin from front jaw to rear jaw"
        >
          <source src={movePinFrontToRear} />
        </AnimationVideo>
      ),
    },
    [REMOVE_PIN_FROM_REAR_JAW]: {
      inProgressText: t('shared:stand_back_robot_is_in_motion'),
      header: t('remove_calibration_pin'),
      body: t('move_pin_from_rear_jaw_to_storage'),
      buttonText: t('complete_calibration'),
      prepImage: (
        <AnimationVideo
          css={css`
            max-width: 100%;
            max-height: 20rem;
          `}
          aria-label="move calibration rear jaw to storage"
        >
          <source src={movePinRearToStorage} />
        </AnimationVideo>
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
  if (isRobotMoving) {
    return (
      <SimpleWizardInProgressBody
        description={
          errorMessage == null && !isExiting
            ? inProgressText
            : t('shared:stand_back_robot_is_in_motion')
        }
        body={
          errorMessage == null && !isExiting
            ? t('calibration_pin_touching', { slot: selectedSlot })
            : null
        }
        alternativeSpinner={
          errorMessage == null && !isExiting ? inProgressImage : undefined
        }
      />
    )
  }

  return errorMessage != null ? (
    <SimpleWizardBody
      isSuccess={false}
      iconColor={COLORS.red50}
      header={t('shared:error_encountered')}
      subHeader={
        <Trans
          t={t}
          i18nKey={'return_pin_error'}
          values={{ error: errorMessage }}
          components={{
            block: (
              <StyledText
                desktopStyle="bodyDefaultRegular"
                oddStyle="bodyTextRegular"
              />
            ),
            bold: (
              <StyledText
                desktopStyle="bodyDefaultSemiBold"
                oddStyle="bodyTextSemiBold"
              />
            ),
          }}
        />
      }
    />
  ) : (
    <GenericWizardTile
      header={
        <StyledText
          desktopStyle="headingSmallBold"
          oddStyle="level4HeaderSemiBold"
        >
          {header}
        </StyledText>
      }
      rightHandBody={prepImage}
      bodyText={
        <StyledText
          desktopStyle="bodyDefaultRegular"
          oddStyle="bodyTextRegular"
        >
          {body}
        </StyledText>
      }
      proceedButtonText={buttonText}
      proceed={handleOnClick}
      proceedIsDisabled={maintenanceRunId == null}
      back={movement !== MOVE_PIN_TO_FRONT_JAW ? goBack : undefined}
    />
  )
}
