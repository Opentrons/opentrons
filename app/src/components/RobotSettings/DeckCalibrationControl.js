// @flow

import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Icon,
  Text,
  SecondaryBtn,
  BORDER_SOLID_LIGHT,
  SPACING_4,
  useConditionalConfirm,
  FONT_STYLE_ITALIC,
  Tooltip,
  useHoverTooltip,
  AlertModal,
} from '@opentrons/components'

import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'
import * as Calibration from '../../calibration'

import { Portal } from '../portal'
import { CalibrateDeck } from '../CalibrateDeck'
import { TitledControl } from '../TitledControl'
import { ConfirmStartDeckCalModal } from './ConfirmStartDeckCalModal'
import { getDeckCalibrationSession } from '../../sessions/deck-calibration/selectors'
import {
  InlineCalibrationWarning,
  REQUIRED,
  RECOMMENDED,
} from '../InlineCalibrationWarning'
import { formatLastModified } from '../CalibrationPanels/utils'

import type { State, Dispatch } from '../../types'
import type {
  DeckCalibrationStatus,
  DeckCalibrationData,
} from '../../calibration/types'
import type {
  SessionCommandString,
  DeckCalibrationSession,
} from '../../sessions/types'
import type { RequestState } from '../../robot-api/types'

// deck calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: Array<SessionCommandString> = [
  Sessions.sharedCalCommands.JOG,
]

export type Props = {|
  robotName: string,
  disabledReason: string | null,
  deckCalStatus: DeckCalibrationStatus | null,
  deckCalData: DeckCalibrationData | null,
  pipOffsetDataPresent: boolean,
|}

export function DeckCalibrationControl(props: Props): React.Node {
  const {
    robotName,
    disabledReason,
    deckCalStatus,
    deckCalData,
    pipOffsetDataPresent,
  } = props

  const { t } = useTranslation(['robot_calibration', 'shared'])
  const [targetProps, tooltipProps] = useHoverTooltip()
  const dispatch = useDispatch<Dispatch>()

  const trackedRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        createRequestId.current = dispatchedAction.meta.requestId
        trackedRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type === Sessions.CREATE_SESSION_COMMAND &&
        dispatchedAction.payload.command.command ===
          Sessions.sharedCalCommands.JOG
      ) {
        jogRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        trackedRequestId.current = dispatchedAction.meta.requestId
      }
    }
  )

  const showSpinner =
    useSelector<State, RequestState | null>(state =>
      trackedRequestId.current
        ? RobotApi.getRequestById(state, trackedRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const createRequest = useSelector((state: State) =>
    createRequestId.current
      ? RobotApi.getRequestById(state, createRequestId.current)
      : null
  )
  const createStatus = createRequest?.status

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

  const handleStartDeckCalSession = () => {
    dispatchRequests(
      Sessions.ensureSession(robotName, Sessions.SESSION_TYPE_DECK_CALIBRATION)
    )
  }

  const deckCalibrationSession: DeckCalibrationSession | null = useSelector(
    (state: State) => {
      return getDeckCalibrationSession(state, robotName)
    }
  )

  const {
    showConfirmation: showConfirmStart,
    confirm: confirmStart,
    cancel: cancelStart,
  } = useConditionalConfirm(handleStartDeckCalSession, !!pipOffsetDataPresent)

  let warningType = null
  if (deckCalStatus && deckCalStatus !== Calibration.DECK_CAL_STATUS_OK) {
    warningType = REQUIRED
  } else if (
    !Array.isArray(deckCalData) &&
    deckCalData?.status &&
    deckCalData.status.markedBad
  ) {
    warningType = RECOMMENDED
  }

  const buildDeckLastCalibrated: (
    data: DeckCalibrationData,
    status: DeckCalibrationStatus
  ) => string = (data, status) => {
    if (status === Calibration.DECK_CAL_STATUS_IDENTITY) {
      return t('deck_calibration_missing')
    }
    const datestring =
      typeof data.lastModified === 'string'
        ? formatLastModified(data.lastModified)
        : t('shared:unknown')
    const getPrefix = calData =>
      typeof data?.source === 'string'
        ? calData.source === Calibration.CALIBRATION_SOURCE_LEGACY
          ? t('last_migrated')
          : t('last_calibrated')
        : t('last_calibrated')

    return `${getPrefix(data)}: ${datestring}`
  }

  const disabledOrBusyReason = showSpinner
    ? t('deck_calibration_spinner', {
        ongoing_action:
          createStatus === RobotApi.PENDING
            ? t('shared:starting')
            : t('shared:ending'),
      })
    : disabledReason

  const buttonText =
    deckCalStatus && deckCalStatus !== Calibration.DECK_CAL_STATUS_IDENTITY
      ? t('deck_calibration_redo')
      : t('calibrate_deck')

  return (
    <>
      <TitledControl
        borderBottom={BORDER_SOLID_LIGHT}
        title={t('calibrate_deck')}
        description={
          <>
            <InlineCalibrationWarning warningType={warningType} />
            <Text>{t('deck_calibration_description')}</Text>
            {deckCalData && deckCalStatus && (
              <Text marginTop={SPACING_4} fontStyle={FONT_STYLE_ITALIC}>
                {buildDeckLastCalibrated(deckCalData, deckCalStatus)}
              </Text>
            )}
          </>
        }
        control={
          <SecondaryBtn
            {...targetProps}
            width="12rem"
            onClick={confirmStart}
            disabled={disabledOrBusyReason}
          >
            {showSpinner ? (
              <Icon name="ot-spinner" height="1em" spin />
            ) : (
              buttonText
            )}
          </SecondaryBtn>
        }
      >
        {disabledOrBusyReason !== null && (
          <Tooltip {...tooltipProps}>{disabledOrBusyReason}</Tooltip>
        )}
      </TitledControl>
      <Portal level="top">
        <CalibrateDeck
          session={deckCalibrationSession}
          robotName={robotName}
          dispatchRequests={dispatchRequests}
          showSpinner={showSpinner}
          isJogging={isJogging}
        />
        {showConfirmStart && pipOffsetDataPresent && (
          <ConfirmStartDeckCalModal
            confirm={confirmStart}
            cancel={cancelStart}
          />
        )}
        {createStatus === RobotApi.FAILURE && (
          <AlertModal
            alertOverlay
            heading={t('deck_calibration_failure')}
            buttons={[
              {
                children: t('shared:ok'),
                onClick: () => {
                  createRequestId.current &&
                    dispatch(RobotApi.dismissRequest(createRequestId.current))
                  createRequestId.current = null
                },
              },
            ]}
          >
            <Text>{t('deck_calibration_error_occured')}</Text>
            <Text>
              {createRequest?.error &&
                RobotApi.getErrorResponseMessage(createRequest.error)}
            </Text>
          </AlertModal>
        )}
      </Portal>
    </>
  )
}
