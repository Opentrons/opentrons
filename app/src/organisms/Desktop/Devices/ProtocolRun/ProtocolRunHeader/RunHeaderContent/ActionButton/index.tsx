import { useSelector } from 'react-redux'

import { RUN_STATUS_STOP_REQUESTED } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  BORDERS,
  DISPLAY_FLEX,
  Icon,
  JUSTIFY_CENTER,
  NO_WRAP,
  PrimaryButton,
  SIZE_1,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { useRobotAnalyticsData } from '/app/redux-resources/analytics'
import { useIsFlex, useRobot } from '/app/redux-resources/robots'
import {
  getCameraUsageState,
  selectIsAnyNecessaryDefaultOffsetMissing,
} from '/app/redux/protocol-runs'
import { useIsRobotOnWrongVersionOfSoftware } from '/app/redux/robot-update'
import {
  useCurrentRunId,
  useModuleCalibrationStatus,
  useProtocolDetailsForRun,
  useRunCalibrationStatus,
  useUnmatchedModulesForProtocol,
} from '/app/resources/runs'

import {
  getFallbackRobotSerialNumber,
  isValidRunAgainStatus,
} from '../../utils'
import { useActionBtnDisabledUtils, useActionButtonProperties } from './hooks'

import type { MutableRefObject, RefObject } from 'react'
import type { State } from '/app/redux/types'
import type { RunHeaderContentProps } from '..'

export type BaseActionButtonProps = RunHeaderContentProps

interface ActionButtonProps extends BaseActionButtonProps {
  isResetRunLoadingRef: MutableRefObject<boolean>
  isClosingCurrentRun: boolean
  protocolRunHeaderRef: RefObject<HTMLDivElement> | null
}

export function ActionButton(props: ActionButtonProps): JSX.Element {
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
  const isFlex = useIsFlex(robotName)
  const { isProtocolAnalyzing, protocolData } = useProtocolDetailsForRun(runId)
  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const { complete: isCalibrationComplete } = useRunCalibrationStatus(
    robotName,
    runId
  )
  const { complete: isModuleCalibrationComplete } = useModuleCalibrationStatus(
    robotName,
    runId
  )
  const isRobotOnWrongVersionOfSoftware =
    useIsRobotOnWrongVersionOfSoftware(robotName)
  const currentRunId = useCurrentRunId()
  const isRequiredOffsetMissing = useSelector(
    selectIsAnyNecessaryDefaultOffsetMissing(runId)
  )

  const { enabled: isCameraEnabled } = useSelector((state: State) =>
    getCameraUsageState(state, runId)
  )
  const isCameraRequiredForRun =
    protocolData != null &&
    'commandPreconditions' in protocolData &&
    protocolData.commandPreconditions?.isCameraUsed
  const isCameraReadyToRun = isCameraRequiredForRun ? isCameraEnabled : true
  const areCameraPreferencesConfirmed = runRecord?.data.cameraSettings != null

  const isSetupComplete =
    isCalibrationComplete &&
    isModuleCalibrationComplete &&
    missingModuleIds.length === 0 &&
    isCameraReadyToRun
  const isRobotTypeSetupComplete = isFlex
    ? isSetupComplete && !isRequiredOffsetMissing
    : isSetupComplete

  const isOtherRunCurrent = currentRunId != null && currentRunId !== runId
  const isProtocolNotReady = protocolData == null || !!isProtocolAnalyzing
  const isValidRunAgain = isValidRunAgainStatus(runStatus, isClosingCurrentRun)
  useActionBtnDisabledUtils({
    isSetupComplete: isRobotTypeSetupComplete,
    isOtherRunCurrent,
    isProtocolNotReady,
    isRobotOnWrongVersionOfSoftware,
    isValidRunAgain,
    isCameraReadyToRun,
    ...props,
  })

  const robot = useRobot(robotName)
  const robotSerialNumber = getFallbackRobotSerialNumber(robot)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)

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
      ...props,
    })
  return (
    <>
      <PrimaryButton
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        boxShadow="none"
        display={DISPLAY_FLEX}
        onClick={handleButtonClick}
        id="ProtocolRunHeader_runControlButton"
        borderRadius={BORDERS.borderRadiusFull}
      >
        {buttonIconName != null ? (
          <Icon
            name={buttonIconName}
            size={SIZE_1}
            marginRight={SPACING.spacing8}
            spin={
              isProtocolNotReady ||
              runStatus === RUN_STATUS_STOP_REQUESTED ||
              isResetRunLoadingRef.current ||
              isClosingCurrentRun
            }
          />
        ) : null}
        <StyledText as="pSemiBold" whiteSpace={NO_WRAP}>
          {buttonText}
        </StyledText>
      </PrimaryButton>
    </>
  )
}
