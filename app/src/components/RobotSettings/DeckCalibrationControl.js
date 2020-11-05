// @flow

import * as React from 'react'

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
import { useSelector } from 'react-redux'
import { format } from 'date-fns'
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
} from '@opentrons/components'

import type { State } from '../../types'
import type {
  DeckCalibrationStatus,
  DeckCalibrationData,
} from '../../calibration/types'
import type {
  SessionCommandString,
  DeckCalibrationSession,
} from '../../sessions/types'
import type { RequestState } from '../../robot-api/types'

const DECK_NEVER_CALIBRATED = "You haven't calibrated the deck yet"
const LAST_CALIBRATED = 'Last calibrated:'
const MIGRATED = 'Last known calibration migrated'
const CALIBRATE_DECK_DESCRIPTION =
  "Calibrate the position of the robot's deck. Recommended for all new robots and after moving robots."
const BUTTON_TEXT_CALIBRATE = 'calibrate deck'
const BUTTON_TEXT_RECALIBRATE = 'recalibrate deck'
const CALIBRATE_TITLE_TEXT = 'Calibrate deck'
const STARTING = 'Deck calibration is starting'
const ENDING = 'Deck calibration is ending'

const buildDeckLastCalibrated: (
  data: DeckCalibrationData,
  status: DeckCalibrationStatus
) => string = (data, status) => {
  if (status === Calibration.DECK_CAL_STATUS_IDENTITY) {
    return DECK_NEVER_CALIBRATED
  }
  const datestring =
    typeof data.lastModified === 'string'
      ? format(new Date(data.lastModified), 'yyyy-MM-dd HH:mm')
      : 'unknown'
  const prefix = calData =>
    typeof data?.source === 'string'
      ? calData.source === Calibration.CALIBRATION_SOURCE_LEGACY
        ? MIGRATED
        : LAST_CALIBRATED
      : LAST_CALIBRATED

  return `${prefix(data)} ${datestring}`
}

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

  const [showWizard, setShowWizard] = React.useState(false)
  const [targetProps, tooltipProps] = useHoverTooltip()

  const trackedRequestId = React.useRef<string | null>(null)
  const deleteRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        createRequestId.current = dispatchedAction.meta.requestId
        trackedRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type === Sessions.DELETE_SESSION &&
        deckCalibrationSession?.id === dispatchedAction.payload.sessionId
      ) {
        deleteRequestId.current = dispatchedAction.meta.requestId
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

  const shouldClose =
    useSelector<State, RequestState | null>(state =>
      deleteRequestId.current
        ? RobotApi.getRequestById(state, deleteRequestId.current)
        : null
    )?.status === RobotApi.SUCCESS

  const createStatus = useSelector((state: State) =>
    createRequestId.current
      ? RobotApi.getRequestById(state, createRequestId.current)
      : null
  )?.status

  const shouldOpen = createStatus === RobotApi.SUCCESS
  const isCreating = createStatus === RobotApi.PENDING

  const isJogging =
    useSelector((state: State) =>
      jogRequestId.current
        ? RobotApi.getRequestById(state, jogRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  React.useEffect(() => {
    if (shouldOpen) {
      setShowWizard(true)
      createRequestId.current = null
    }
    if (shouldClose) {
      setShowWizard(false)
      deleteRequestId.current = null
    }
  }, [shouldOpen, shouldClose])

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
  } = useConditionalConfirm(() => {
    handleStartDeckCalSession()
  }, !!pipOffsetDataPresent)

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

  const disabledIncludingSpinner = showSpinner
    ? isCreating
      ? STARTING
      : ENDING
    : disabledReason

  const buttonChildren = showSpinner ? (
    <Icon name="ot-spinner" height="1em" spin />
  ) : deckCalStatus &&
    deckCalStatus !== Calibration.DECK_CAL_STATUS_IDENTITY ? (
    BUTTON_TEXT_RECALIBRATE
  ) : (
    BUTTON_TEXT_CALIBRATE
  )

  return (
    <>
      <TitledControl
        borderBottom={BORDER_SOLID_LIGHT}
        title={CALIBRATE_TITLE_TEXT}
        description={
          <>
            <InlineCalibrationWarning warningType={warningType} />
            <Text>{CALIBRATE_DECK_DESCRIPTION}</Text>
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
            width="13rem"
            onClick={confirmStart}
            disabled={disabledIncludingSpinner}
          >
            {buttonChildren}
          </SecondaryBtn>
        }
      >
        {disabledIncludingSpinner !== null && (
          <Tooltip {...tooltipProps}>{disabledIncludingSpinner}</Tooltip>
        )}
      </TitledControl>
      {showConfirmStart && pipOffsetDataPresent && (
        <Portal level="top">
          <ConfirmStartDeckCalModal
            confirm={confirmStart}
            cancel={cancelStart}
          />
        </Portal>
      )}
      {showWizard && (
        <Portal level="top">
          <CalibrateDeck
            session={deckCalibrationSession}
            robotName={robotName}
            closeWizard={() => setShowWizard(false)}
            dispatchRequests={dispatchRequests}
            showSpinner={showSpinner}
            isJogging={isJogging}
          />
        </Portal>
      )}
    </>
  )
}
