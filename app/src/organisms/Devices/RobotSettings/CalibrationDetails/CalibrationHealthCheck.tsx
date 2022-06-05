import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  useHoverTooltip,
  TOOLTIP_LEFT,
} from '@opentrons/components'

import { Portal } from '../../../../App/portal'
import { TertiaryButton } from '../../../../atoms/buttons'
import { StyledText } from '../../../../atoms/text'
import { Tooltip } from '../../../../atoms/Tooltip'
import * as RobotApi from '../../../../redux/robot-api'
import * as Config from '../../../../redux/config'
import * as Sessions from '../../../../redux/sessions'
import { useIsRobotBusy } from '../../hooks'
import { AskForCalibrationBlockModal } from '../../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'

import type { SessionCommandString } from '../../../../redux/sessions/types'

interface CalibrationHealthCheckProps {
  robotName: string
  calCheckButtonDisabled: boolean
  updateRobotStatus: (isRobotBusy: boolean) => void
}

const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export function CalibrationHealthCheck({
  robotName,
  calCheckButtonDisabled,
  updateRobotStatus,
}: CalibrationHealthCheckProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'robot_calibration'])
  const trackedRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)
  const [showCalBlockModal, setShowCalBlockModal] = React.useState<boolean>(
    false
  )
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })
  const isBusy = useIsRobotBusy()
  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        createRequestId.current =
          'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      } else if (
        dispatchedAction.type === Sessions.CREATE_SESSION_COMMAND &&
        dispatchedAction.payload.command.command ===
          Sessions.sharedCalCommands.JOG
      ) {
        jogRequestId.current =
          'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      } else if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        trackedRequestId.current =
          'meta' in dispatchedAction && 'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      }
    }
  )

  const handleHealthCheck = (
    hasBlockModalResponse: boolean | null = null
  ): void => {
    if (isBusy) {
      updateRobotStatus(true)
    } else {
      if (
        hasBlockModalResponse === null &&
        configHasCalibrationBlock === null
      ) {
        setShowCalBlockModal(true)
      } else {
        setShowCalBlockModal(false)
        dispatchRequests(
          Sessions.ensureSession(
            robotName,
            Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
            {
              tipRacks: [],
              hasCalibrationBlock: Boolean(
                configHasCalibrationBlock ?? hasBlockModalResponse
              ),
            }
          )
        )
      }
    }
  }

  return (
    <>
      <Portal level="top">
        {showCalBlockModal ? (
          <AskForCalibrationBlockModal
            onResponse={handleHealthCheck}
            titleBarTitle={t('robot_calibration:health_check_title')}
            closePrompt={() => setShowCalBlockModal(false)}
          />
        ) : null}
      </Portal>
      <Box paddingTop={SPACING.spacing5} paddingBottom={SPACING.spacing5}>
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('calibration_health_check_title')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('calibration_health_check_description')}
            </StyledText>
          </Box>
          <TertiaryButton
            {...targetProps}
            onClick={() => handleHealthCheck(null)}
            disabled={calCheckButtonDisabled}
          >
            {t('health_check_button')}
          </TertiaryButton>
          {calCheckButtonDisabled && (
            <Tooltip tooltipProps={tooltipProps}>
              {t('fully_calibrate_before_checking_health')}
            </Tooltip>
          )}
        </Flex>
      </Box>
    </>
  )
}
