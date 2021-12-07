import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  useConditionalConfirm,
  SpinnerModalPage,
  NewPrimaryBtn,
  Link,
  Box,
  Text,
  Tooltip,
  useHoverTooltip,
  C_DISABLED,
  SIZE_5,
  TEXT_DECORATION_UNDERLINE,
  TEXT_ALIGN_CENTER,
  TOOLTIP_LEFT,
  FONT_BODY_2_DARK,
} from '@opentrons/components'
import * as RobotApi from '../../../../redux/robot-api'
import * as Sessions from '../../../../redux/sessions'
import * as Config from '../../../../redux/config'

import { getTipLengthCalibrationSession } from '../../../../redux/sessions/tip-length-calibration/selectors'
import { getPipetteOffsetCalibrationSession } from '../../../../redux/sessions/pipette-offset-calibration/selectors'

import {
  CalibrateTipLength,
  ConfirmRecalibrationModal,
} from '../../../../organisms/CalibrateTipLength'
import { AskForCalibrationBlockModal } from '../../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'

import { Portal } from '../../../../App/portal'
import { CalibratePipetteOffset } from '../../../../organisms/CalibratePipetteOffset'
import { INTENT_TIP_LENGTH_IN_PROTOCOL } from '../../../../organisms/CalibrationPanels'
import {
  tipLengthCalibrationStarted,
  pipetteOffsetCalibrationStarted,
} from '../../../../redux/analytics'
import { useRunStatus } from '../../../RunTimeControl/hooks'

import type { State } from '../../../../redux/types'
import type {
  SessionCommandString,
  PipetteOffsetCalibrationSession,
  TipLengthCalibrationSession,
} from '../../../../redux/sessions/types'
import type { RequestState } from '../../../../redux/robot-api/types'
import type { Mount } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const TIP_LENGTH_CALIBRATION = 'tip length calibration'
const EXIT = 'exit'

export interface TipLengthCalibrationProps {
  robotName: string
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

export function TipLengthCalibration({
  robotName,
  hasCalibrated,
  mount,
  tipRackDefinition,
  isExtendedPipOffset,
  disabled,
}: TipLengthCalibrationProps): JSX.Element {
  const createRequestId = React.useRef<string | null>(null)
  const trackedRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)
  const dispatch = useDispatch()
  const { t } = useTranslation(['protocol_setup'])

  const sessionType = isExtendedPipOffset
    ? Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
    : Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION

  const uriFromDef = (definition: LabwareDefinition2): string =>
    `${definition.namespace}/${definition.parameters.loadName}/${definition.version}`

  const dispatchAnalyticsEvent = isExtendedPipOffset
    ? (calBlock: boolean): void => {
        dispatch(
          pipetteOffsetCalibrationStarted(
            INTENT_TIP_LENGTH_IN_PROTOCOL,
            mount,
            calBlock,
            true,
            uriFromDef(tipRackDefinition)
          )
        )
      }
    : (calBlock: boolean): void => {
        dispatch(
          tipLengthCalibrationStarted(
            INTENT_TIP_LENGTH_IN_PROTOCOL,
            mount,
            calBlock,
            uriFromDef(tipRackDefinition)
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

  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)
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

  const runStatus = useRunStatus()
  const disableRecalibrate = runStatus != null && runStatus !== RUN_STATUS_IDLE

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  const recalibrateLink = disableRecalibrate ? (
    <>
      <Text color={C_DISABLED} {...targetProps}>
        {t('recalibrate')}
      </Text>
      <Tooltip {...tooltipProps}>
        {
          <Box width={SIZE_5} textAlign={TEXT_ALIGN_CENTER}>
            {t('recalibrating_tip_length_not_available')}
          </Box>
        }
      </Tooltip>
    </>
  ) : (
    <Link
      onClick={() => confirm(true)}
      textDecoration={TEXT_DECORATION_UNDERLINE}
      css={FONT_BODY_2_DARK}
      id={'TipRackCalibration_recalibrateTipRackLink'}
    >
      {t('recalibrate')}
    </Link>
  )

  return (
    <>
      {hasCalibrated ? (
        recalibrateLink
      ) : (
        <NewPrimaryBtn
          onClick={() => handleStart()}
          id={'TipRackCalibration_calibrateTipRackButton'}
          disabled={disabled}
        >
          {t('calibrate_now_cta')}
        </NewPrimaryBtn>
      )}
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
            titleBarTitle={TIP_LENGTH_CALIBRATION}
            closePrompt={() => setShowCalBlockModal(false)}
          />
        ) : null}
        {startingSession ? (
          <SpinnerModalPage
            titleBar={{
              title: TIP_LENGTH_CALIBRATION,
              back: {
                disabled: true,
                title: EXIT,
                children: EXIT,
              },
            }}
          />
        ) : null}
        {isExtendedPipOffset ? (
          <CalibratePipetteOffset
            session={extendedPipetteCalibrationSession}
            robotName={robotName}
            showSpinner={showSpinner}
            dispatchRequests={dispatchRequests}
            isJogging={isJogging}
            intent={INTENT_TIP_LENGTH_IN_PROTOCOL}
          />
        ) : (
          <CalibrateTipLength
            session={tipLengthCalibrationSession}
            robotName={robotName}
            showSpinner={showSpinner}
            dispatchRequests={dispatchRequests}
            isJogging={isJogging}
          />
        )}
      </Portal>
    </>
  )
}
