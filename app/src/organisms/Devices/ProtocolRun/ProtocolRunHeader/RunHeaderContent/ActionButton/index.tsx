import * as React from 'react'

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

import {
  useModuleCalibrationStatus,
  useProtocolDetailsForRun,
  useRobot,
  useRobotAnalyticsData,
  useRunCalibrationStatus,
  useUnmatchedModulesForProtocol,
} from '../../../../hooks'
import { useCurrentRunId } from '../../../../../../resources/runs'
import { RUN_AGAIN_STATUSES } from '../../constants'
import {
  useActionBtnDisabledUtils,
  useButtonProperties,
  useIsRobotOnWrongVersionOfSoftware,
} from './hooks'
import { getFallbackRobotSerialNumber } from '../../utils'
import type { RunHeaderContentProps } from '..'

export type BaseActionButtonProps = RunHeaderContentProps

interface ActionButtonProps extends BaseActionButtonProps {
  isResetRunLoadingRef: React.MutableRefObject<boolean>
}

export function ActionButton(props: ActionButtonProps): JSX.Element {
  const {
    runId,
    robotName,
    runStatus,
    isResetRunLoadingRef,
    protocolRunControls,
    runHeaderModalContainerUtils,
  } = props
  const {
    missingStepsModalUtils,
    HSConfirmationModalUtils,
  } = runHeaderModalContainerUtils

  const [targetProps, tooltipProps] = useHoverTooltip()
  const { isResetRunLoading } = protocolRunControls

  const { isProtocolAnalyzing, protocolData } = useProtocolDetailsForRun(runId)
  isResetRunLoadingRef.current = isResetRunLoading

  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const { complete: isCalibrationComplete } = useRunCalibrationStatus(
    robotName,
    runId
  )
  const { complete: isModuleCalibrationComplete } = useModuleCalibrationStatus(
    robotName,
    runId
  )

  const isSetupComplete =
    isCalibrationComplete &&
    isModuleCalibrationComplete &&
    missingModuleIds.length === 0
  const isRobotOnWrongVersionOfSoftware = useIsRobotOnWrongVersionOfSoftware(
    robotName
  )

  const currentRunId = useCurrentRunId()
  const isCurrentRun = currentRunId === runId
  const isOtherRunCurrent = currentRunId != null && currentRunId !== runId
  const isProtocolNotReady = protocolData == null || !!isProtocolAnalyzing
  const isValidRunAgain = RUN_AGAIN_STATUSES.includes(runStatus)

  const { isDisabled, disabledReason } = useActionBtnDisabledUtils({
    isCurrentRun,
    isSetupComplete,
    isOtherRunCurrent,
    isProtocolNotReady,
    isRobotOnWrongVersionOfSoftware,
    isValidRunAgain,
    ...props,
  })

  const robot = useRobot(robotName)
  const robotSerialNumber = getFallbackRobotSerialNumber(robot)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)

  const validRunAgainButRequiresSetup = isValidRunAgain && !isSetupComplete
  const runAgainWithSpinner = validRunAgainButRequiresSetup && isResetRunLoading

  const { buttonText, handleButtonClick, buttonIconName } = useButtonProperties(
    {
      isProtocolNotReady,
      runAgainWithSpinner,
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
      ...props,
    }
  )

  return (
    <>
      <PrimaryButton
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        boxShadow="none"
        display={DISPLAY_FLEX}
        padding={`${SPACING.spacing12} ${SPACING.spacing16}`}
        disabled={isDisabled && !validRunAgainButRequiresSetup}
        onClick={handleButtonClick}
        id="ProtocolRunHeader_runControlButton"
        {...targetProps}
      >
        {buttonIconName && (
          <Icon
            name={buttonIconName}
            size={SIZE_1}
            marginRight={SPACING.spacing8}
            spin={
              isProtocolNotReady ||
              runStatus === RUN_STATUS_STOP_REQUESTED ||
              runAgainWithSpinner
            }
          />
        )}
        <StyledText as="pSemiBold">{buttonText}</StyledText>
      </PrimaryButton>
      {disabledReason && (
        <Tooltip tooltipProps={tooltipProps} width="auto" maxWidth="8rem">
          {disabledReason}
        </Tooltip>
      )}
    </>
  )
}
