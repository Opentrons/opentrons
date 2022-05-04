import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import * as RobotApi from '../../../redux/robot-api'
import * as Sessions from '../../../redux/sessions'
import * as Config from '../../../redux/config'

import {
  SpinnerModalPage,
  Box,
  SPACING,
  ALIGN_CENTER,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  UseHoverTooltipTargetProps,
} from '@opentrons/components'

import { Portal } from '../../../App/portal'
import { CheckCalibration } from '../../../organisms/CheckCalibration'
import { StyledText } from '../../../atoms/text'
import { TertiaryButton } from '../../../atoms/Buttons'
import { AskForCalibrationBlockModal } from '../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'

import type { SessionCommandString } from '../../../redux/sessions/types'
import type { RequestState } from '../../../redux/robot-api/types'
import type { State } from '../../../redux/types'

export interface CheckCalibrationControlProps {
  robotName: string
  disabledReason: string | null
  children?: React.ReactNode
  targetProps?: UseHoverTooltipTargetProps
}

// pipette calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export function CheckCalibrationControl({
  robotName,
  children,
  disabledReason,
  targetProps,
}: CheckCalibrationControlProps): JSX.Element {
  const { t } = useTranslation(['robot_calibration', 'shared'])

  const trackedRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        // @ts-expect-error TODO: should be the code in comment below
        createRequestId.current = dispatchedAction.meta.requestId
        // createRequestId.current =
        //   'requestId' in dispatchedAction.meta
        //     ? dispatchedAction.meta.requestId ?? null
        //     : null
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

  const createStatus = useSelector<State, RequestState | null>(state =>
    createRequestId.current
      ? RobotApi.getRequestById(state, createRequestId.current)
      : null
  )?.status

  const showSpinner =
    useSelector<State, RequestState | null>(state =>
      trackedRequestId.current
        ? RobotApi.getRequestById(state, trackedRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const isJogging =
    useSelector((state: State) =>
      jogRequestId.current
        ? RobotApi.getRequestById(state, jogRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  React.useEffect(() => {
    if (createStatus === RobotApi.SUCCESS) {
      createRequestId.current = null
    }
  }, [createStatus])

  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)
  const [showCalBlockModal, setShowCalBlockModal] = React.useState(false)

  const handleStart = (hasBlockModalResponse: boolean | null = null): void => {
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
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

  const checkHealthSession = useSelector((state: State) => {
    const session: Sessions.Session | null = Sessions.getRobotSessionOfType(
      state,
      robotName,
      Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
    )
    if (
      session &&
      session.sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
    ) {
      return session
    }
    return null
  })

  return (
    <>
      <Box paddingBottom={SPACING.spacing5} marginTop="24px">
        <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Box marginRight={SPACING.spacing6}>
            <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing3}>
              {t('calibration_health_check')}
            </Box>
            <StyledText as="p" marginBottom={SPACING.spacing3}>
              {t('check_accuracy')}
            </StyledText>
          </Box>
          <TertiaryButton
            {...targetProps}
            onClick={() => handleStart(null)}
            disabled={disabledReason != null}
          >
            {t('check_health')}
          </TertiaryButton>
          {children}
        </Flex>
      </Box>
      <Portal level="top">
        {showCalBlockModal ? (
          <AskForCalibrationBlockModal
            onResponse={handleStart}
            titleBarTitle={t('health_check_title')}
            closePrompt={() => setShowCalBlockModal(false)}
          />
        ) : null}
        {createStatus === RobotApi.PENDING ? (
          <SpinnerModalPage
            titleBar={{
              title: t('health_check_title'),
              back: {
                disabled: true,
                title: t('shared:exit'),
                children: t('shared:exit'),
              },
            }}
          />
        ) : null}
        <CheckCalibration
          session={checkHealthSession}
          robotName={robotName}
          dispatchRequests={dispatchRequests}
          showSpinner={showSpinner}
          isJogging={isJogging}
        />
      </Portal>
    </>
  )
}
