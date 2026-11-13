import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { RUN_STATUS_STOP_REQUESTED } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  BORDERS,
  DISPLAY_FLEX,
  Icon,
  JUSTIFY_CENTER,
  NO_WRAP,
  PrimaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { isValidRunAgainStatus } from '/app/local-resources/runs/utils'
import { useRobotAnalyticsData } from '/app/redux-resources/analytics'
import { useRobot } from '/app/redux-resources/robots'
import { getCameraUsageState } from '/app/redux/protocol-runs'
import { useIsRobotOnWrongVersionOfSoftware } from '/app/redux/robot-update'
import { useCurrentRunId, useProtocolDetailsForRun } from '/app/resources/runs'

import { RobotOutOfStorageModal } from '../../../../RobotOutOfStorageModal.tsx'
import { getFallbackRobotSerialNumber } from '../../utils'
import { useActionButtonProperties } from './hooks'

import type { MutableRefObject, ReactNode } from 'react'
import type { State } from '/app/redux/types'
import type { RunHeaderContentProps } from '..'

export type BaseActionButtonProps = RunHeaderContentProps

interface ActionButtonProps extends BaseActionButtonProps {
  isResetRunLoadingRef: MutableRefObject<boolean>
  isClosingCurrentRun: boolean
}

export function ActionButton(props: ActionButtonProps): ReactNode {
  const {
    runId,
    runRecord,
    robotName,
    runStatus,
    isResetRunLoadingRef,
    runHeaderModalContainerUtils,
    isClosingCurrentRun,
  } = props
  const { missingStepsModalUtils, HSConfirmationModalUtils } =
    runHeaderModalContainerUtils
  const { isProtocolAnalyzing, protocolData } = useProtocolDetailsForRun(runId)
  const isRobotOnWrongVersionOfSoftware =
    useIsRobotOnWrongVersionOfSoftware(robotName)
  const currentRunId = useCurrentRunId()
  const { enabled: isCameraEnabled } = useSelector((state: State) =>
    getCameraUsageState(state, runId)
  )
  const isCameraRequiredForRun =
    protocolData != null &&
    'commandPreconditions' in protocolData &&
    protocolData.commandPreconditions?.isCameraUsed
  const isCameraReadyToRun = isCameraRequiredForRun ? isCameraEnabled : true
  const areCameraPreferencesConfirmed = runRecord?.data.cameraSettings != null

  const isOtherRunCurrent = currentRunId != null && currentRunId !== runId
  const isProtocolNotReady = protocolData == null || !!isProtocolAnalyzing
  const isValidRunAgain = isValidRunAgainStatus(runStatus, isClosingCurrentRun)

  const robot = useRobot(robotName)
  const robotSerialNumber = getFallbackRobotSerialNumber(robot)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const [showRobotOutOfStorageModal, setShowRobotOutOfStorageModal] =
    useState<boolean>(false)
  const navigate = useNavigate()

  const { buttonText, handleButtonClick, buttonIconName } =
    useActionButtonProperties({
      isProtocolNotReady,
      confirmMissingSteps:
        missingStepsModalUtils.conditionalConfirmUtils.confirm,
      confirmAttachment:
        HSConfirmationModalUtils.conditionalConfirmUtils.confirm,
      robotAnalyticsData,
      robotSerialNumber,
      currentRunId,
      isValidRunAgain,
      isOtherRunCurrent,
      isRobotOnWrongVersionOfSoftware,
      areCameraPreferencesConfirmed,
      isCameraReadyToRun,
      setShowRobotOutOfStorageModal,
      ...props,
    })
  return (
    <>
      {showRobotOutOfStorageModal ? (
        <RobotOutOfStorageModal
          onConfirm={() => {
            navigate(`/devices/${robotName}/robot-settings/file-manager`)
          }}
          onClose={() => {
            setShowRobotOutOfStorageModal(false)
          }}
        />
      ) : null}
      <PrimaryButton
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        boxShadow="none"
        display={DISPLAY_FLEX}
        onClick={handleButtonClick}
        borderRadius={BORDERS.borderRadiusFull}
        gap={buttonIconName != null ? SPACING.spacing8 : 0}
      >
        {buttonIconName != null ? (
          <Icon
            name={buttonIconName}
            size="1rem"
            spin={
              isProtocolNotReady ||
              runStatus === RUN_STATUS_STOP_REQUESTED ||
              isResetRunLoadingRef.current ||
              isClosingCurrentRun
            }
          />
        ) : null}
        <StyledText desktopStyle="bodyDefaultSemiBold" whiteSpace={NO_WRAP}>
          {buttonText}
        </StyledText>
      </PrimaryButton>
    </>
  )
}
