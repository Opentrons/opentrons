import { useSelector } from 'react-redux'

import { RUN_STATUS_STOP_REQUESTED } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  DISPLAY_FLEX,
  Icon,
  JUSTIFY_CENTER,
  PrimaryButton,
  SIZE_1,
  SPACING,
  StyledText,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import { useRobotAnalyticsData } from '/app/redux-resources/analytics'
import { useIsFlex, useRobot } from '/app/redux-resources/robots'
import { selectIsAnyNecessaryDefaultOffsetMissing } from '/app/redux/protocol-runs'
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

import type { MutableRefObject } from 'react'
import type { RunHeaderContentProps } from '..'

export type BaseActionButtonProps = RunHeaderContentProps

interface ActionButtonProps extends BaseActionButtonProps {
  isResetRunLoadingRef: MutableRefObject<boolean>
  isClosingCurrentRun: boolean
}

export function ActionButton(props: ActionButtonProps): JSX.Element {
  const {
    runId,
    robotName,
    runStatus,
    isResetRunLoadingRef,
    runHeaderModalContainerUtils,
    isClosingCurrentRun,
  } = props
  const {
    missingStepsModalUtils,
    HSConfirmationModalUtils,
  } = runHeaderModalContainerUtils

  const isFlex = useIsFlex(robotName)
  const [targetProps, tooltipProps] = useHoverTooltip()
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
  const isRobotOnWrongVersionOfSoftware = useIsRobotOnWrongVersionOfSoftware(
    robotName
  )
  const currentRunId = useCurrentRunId()
  const isRequiredOffsetMissing = useSelector(
    selectIsAnyNecessaryDefaultOffsetMissing(runId)
  )

  const isSetupComplete =
    isCalibrationComplete &&
    isModuleCalibrationComplete &&
    missingModuleIds.length === 0
  const isRobotTypeSetupComplete = isFlex
    ? isSetupComplete && !isRequiredOffsetMissing
    : isSetupComplete

  const isCurrentRun = currentRunId === runId
  const isOtherRunCurrent = currentRunId != null && currentRunId !== runId
  const isProtocolNotReady = protocolData == null || !!isProtocolAnalyzing
  const isValidRunAgain = isValidRunAgainStatus(runStatus, isClosingCurrentRun)

  const { isDisabled, disabledReason } = useActionBtnDisabledUtils({
    isCurrentRun,
    isSetupComplete: isRobotTypeSetupComplete,
    isOtherRunCurrent,
    isProtocolNotReady,
    isRobotOnWrongVersionOfSoftware,
    isValidRunAgain,
    ...props,
  })

  const robot = useRobot(robotName)
  const robotSerialNumber = getFallbackRobotSerialNumber(robot)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)

  const validRunAgainButRequiresSetup =
    isValidRunAgain && !isRobotTypeSetupComplete

  const {
    buttonText,
    handleButtonClick,
    buttonIconName,
  } = useActionButtonProperties({
    isProtocolNotReady,
    confirmMissingSteps: missingStepsModalUtils.conditionalConfirmUtils.confirm,
    confirmAttachment: HSConfirmationModalUtils.conditionalConfirmUtils.confirm,
    robotAnalyticsData,
    robotSerialNumber,
    currentRunId,
    isValidRunAgain,
    isOtherRunCurrent,
    isRobotOnWrongVersionOfSoftware,
    ...props,
  })

  return (
    <>
      <PrimaryButton
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        boxShadow="none"
        display={DISPLAY_FLEX}
        padding={`${SPACING.spacing12} ${SPACING.spacing16}`}
        // TODO(jh, 05-05-25): These boolean checks should live in useActionBtnDisabledUtils as a part of the singular disabled check.
        disabled={
          isDisabled && (!validRunAgainButRequiresSetup || isClosingCurrentRun)
        }
        onClick={handleButtonClick}
        id="ProtocolRunHeader_runControlButton"
        {...targetProps}
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
        <StyledText desktopStyle="bodyDefaultSemiBold">{buttonText}</StyledText>
      </PrimaryButton>
      {disabledReason && (
        <Tooltip tooltipProps={tooltipProps} width="auto" maxWidth="8rem">
          {disabledReason}
        </Tooltip>
      )}
    </>
  )
}
