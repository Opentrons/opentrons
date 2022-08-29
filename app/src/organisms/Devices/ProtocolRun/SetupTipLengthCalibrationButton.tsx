import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  Link,
  SpinnerModalPage,
  Tooltip,
  useConditionalConfirm,
  useHoverTooltip,
  ALIGN_CENTER,
  SIZE_4,
  TEXT_ALIGN_CENTER,
  TOOLTIP_LEFT,
  COLORS,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getLabwareDefURI } from '@opentrons/shared-data'

import { Portal } from '../../../App/portal'
import { TertiaryButton } from '../../../atoms/buttons'
import { CalibratePipetteOffset } from '../../CalibratePipetteOffset'
import {
  CalibrateTipLength,
  ConfirmRecalibrationModal,
} from '../../CalibrateTipLength'
import { AskForCalibrationBlockModal } from '../../CalibrateTipLength/AskForCalibrationBlockModal'
import { INTENT_TIP_LENGTH_IN_PROTOCOL } from '../../CalibrationPanels'
import {
  tipLengthCalibrationStarted,
  pipetteOffsetCalibrationStarted,
} from '../../../redux/analytics'
import { getHasCalibrationBlock } from '../../../redux/config'
import * as RobotApi from '../../../redux/robot-api'
import * as Sessions from '../../../redux/sessions'
import { getPipetteOffsetCalibrationSession } from '../../../redux/sessions/pipette-offset-calibration/selectors'
import { getTipLengthCalibrationSession } from '../../../redux/sessions/tip-length-calibration/selectors'
import { useDeckCalibrationData, useRunHasStarted } from '../hooks'

import type { Mount } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { RequestState } from '../../../redux/robot-api/types'
import type {
  SessionCommandString,
  PipetteOffsetCalibrationSession,
  TipLengthCalibrationSession,
} from '../../../redux/sessions/types'
import type { State } from '../../../redux/types'

export interface SetupTipLengthCalibrationButtonProps {
  robotName: string
  runId: string
  hasCalibrated: boolean
  mount: Mount
  tipRackDefinition: LabwareDefinition2
  isExtendedPipOffset: boolean
  disabled: boolean
}

// tip length calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export function SetupTipLengthCalibrationButton({
  robotName,
  runId,
  hasCalibrated,
  mount,
  tipRackDefinition,
  isExtendedPipOffset,
  disabled,
}: SetupTipLengthCalibrationButtonProps): JSX.Element {
  const createRequestId = React.useRef<string | null>(null)
  const trackedRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)
  const dispatch = useDispatch()
  const { t } = useTranslation(['protocol_setup', 'shared'])

  const { isDeckCalibrated } = useDeckCalibrationData(robotName)

  const sessionType = isExtendedPipOffset
    ? Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
    : Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION

  const dispatchAnalyticsEvent = isExtendedPipOffset
    ? (calBlock: boolean): void => {
        dispatch(
          pipetteOffsetCalibrationStarted(
            INTENT_TIP_LENGTH_IN_PROTOCOL,
            mount,
            calBlock,
            true,
            getLabwareDefURI(tipRackDefinition)
          )
        )
      }
    : (calBlock: boolean): void => {
        dispatch(
          tipLengthCalibrationStarted(
            INTENT_TIP_LENGTH_IN_PROTOCOL,
            mount,
            calBlock,
            getLabwareDefURI(tipRackDefinition)
          )
        )
      }

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (
        dispatchedAction.type === Sessions.ENSURE_SESSION &&
        dispatchedAction.payload.sessionType === sessionType
      ) {
        // @ts-expect-error TODO: account for possible absence of requestId on meta
        createRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type === Sessions.CREATE_SESSION_COMMAND &&
        dispatchedAction.payload.command.command ===
          Sessions.sharedCalCommands.JOG
      ) {
        // @ts-expect-error TODO: account for possible absence of requestId on meta
        jogRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        // @ts-expect-error TODO: account for possible absence of meta on action, requestId on meta
        trackedRequestId.current = dispatchedAction.meta.requestId
      }
    }
  )

  const tipLengthCalibrationSession: TipLengthCalibrationSession | null = useSelector(
    (state: State) => {
      return getTipLengthCalibrationSession(state, robotName)
    }
  )
  const extendedPipetteCalibrationSession: PipetteOffsetCalibrationSession | null = useSelector(
    (state: State) => {
      return getPipetteOffsetCalibrationSession(state, robotName)
    }
  )

  const configHasCalibrationBlock = useSelector(getHasCalibrationBlock)
  const [showCalBlockModal, setShowCalBlockModal] = React.useState(false)

  const handleStart = (hasBlockModalResponse: boolean | null = null): void => {
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
      setShowCalBlockModal(true)
    } else {
      setShowCalBlockModal(false)
      const sharedOptions = {
        mount,
        hasCalibrationBlock: Boolean(
          configHasCalibrationBlock ?? hasBlockModalResponse
        ),
        tipRackDefinition,
      }
      const options = isExtendedPipOffset
        ? { ...sharedOptions, shouldRecalibrateTipLength: true }
        : sharedOptions
      dispatchRequests(Sessions.ensureSession(robotName, sessionType, options))
      dispatchAnalyticsEvent(sharedOptions.hasCalibrationBlock)
    }
  }

  const startingSession =
    useSelector<State, RequestState | null>(state =>
      createRequestId.current
        ? RobotApi.getRequestById(state, createRequestId.current)
        : null
    )?.status === RobotApi.PENDING

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

  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    handleStart,
    hasCalibrated
  )

  const runHasStarted = useRunHasStarted(runId)
  const disableRecalibrate = runHasStarted || !isDeckCalibrated

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  const recalibrateLink = disableRecalibrate ? (
    <>
      <Box
        color={COLORS.errorDisabled}
        css={TYPOGRAPHY.labelSemiBold}
        {...targetProps}
      >
        {t('recalibrate')}
      </Box>
      <Tooltip {...tooltipProps}>
        {
          <Box width={SIZE_4} textAlign={TEXT_ALIGN_CENTER}>
            {isDeckCalibrated
              ? t('recalibrating_tip_length_not_available')
              : t('calibrate_deck_to_proceed_to_tip_length_calibration')}
          </Box>
        }
      </Tooltip>
    </>
  ) : (
    <Link
      role="link"
      onClick={() => confirm(null)}
      css={TYPOGRAPHY.labelSemiBold}
      id="TipRackCalibration_recalibrateTipRackLink"
    >
      {t('recalibrate')}
    </Link>
  )

  return (
    <>
      <Flex alignItems={ALIGN_CENTER}>
        {hasCalibrated ? (
          recalibrateLink
        ) : (
          <>
            <TertiaryButton
              onClick={() => handleStart(null)}
              id="TipRackCalibration_calibrateTipRackButton"
              disabled={disabled || !isDeckCalibrated}
              {...targetProps}
            >
              {t('calibrate_now_cta')}
            </TertiaryButton>
            {!isDeckCalibrated ? (
              <Tooltip {...tooltipProps}>
                {
                  <Box width={SIZE_4}>
                    {t('calibrate_deck_to_proceed_to_tip_length_calibration')}
                  </Box>
                }
              </Tooltip>
            ) : null}
          </>
        )}
      </Flex>
      {showConfirmation && (
        <Portal>
          <ConfirmRecalibrationModal
            confirm={confirm}
            cancel={cancel}
            tiprackDisplayName={tipRackDefinition.metadata.displayName}
          />
        </Portal>
      )}
      <Portal level="top">
        {showCalBlockModal ? (
          <AskForCalibrationBlockModal
            onResponse={handleStart}
            titleBarTitle={t('tip_length_calibration')}
            closePrompt={() => setShowCalBlockModal(false)}
          />
        ) : null}
        {startingSession ? (
          <SpinnerModalPage
            titleBar={{
              title: t('tip_length_calibration'),
              back: {
                disabled: true,
                title: t('shared:exit'),
                children: t('shared:exit'),
              },
            }}
          />
        ) : null}
        <CalibrateTipLength
          session={tipLengthCalibrationSession}
          robotName={robotName}
          showSpinner={showSpinner}
          dispatchRequests={dispatchRequests}
          isJogging={isJogging}
        />
      </Portal>
    </>
  )
}
