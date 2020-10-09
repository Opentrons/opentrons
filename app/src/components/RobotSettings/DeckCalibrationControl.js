// @flow

import * as React from 'react'

import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'
import * as Calibration from '../../calibration'

import { Portal } from '../portal'
import { CalibrateDeck } from '../CalibrateDeck'
import { TitledControl } from '../TitledControl'
import { ConfirmStartDeckCalModal } from './ConfirmStartDeckCalModal'
import { InlineCalibrationWarning, REQUIRED, RECOMMENDED } from './InlineCalibrationWarning'
import { useSelector } from 'react-redux'
import { format } from 'date-fns'
import {
  Text,
  SecondaryBtn,
  BORDER_SOLID_LIGHT,
  SPACING_4,
  useConditionalConfirm,
  FONT_STYLE_ITALIC,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import { DECK_CAL_STATUS_OK } from '../../calibration'
import type { State } from '../../types'
import type {
  DeckCalibrationStatus,
  DeckCalibrationData,
} from '../../calibration/types'
import type { SessionCommandString } from '../../sessions/types'
import type { RequestState } from '../../robot-api/types'

const DECK_NEVER_CALIBRATED = "You haven't calibrated the deck yet"
const LAST_CALIBRATED = 'Last calibrated: '
const CALIBRATE_DECK_DESCRIPTION =
  "Calibrate the position of the robot's deck. Recommended for all new robots and after moving robots."
const CALIBRATE_BUTTON_TEXT = 'Calibrate'
const CALIBRATE_TITLE_TEXT = 'Calibrate deck'

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
  return `${LAST_CALIBRATED} ${datestring}`
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
|}

export function DeckCalibrationControl(props: Props): React.Node {
  const { robotName, disabledReason, deckCalStatus, deckCalData } = props

  const [showWizard, setShowWizard] = React.useState(false)
  const [targetProps, tooltipProps] = useHoverTooltip()

  const trackedRequestId = React.useRef<string | null>(null)
  const deleteRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        createRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type === Sessions.DELETE_SESSION &&
        deckCalibrationSession?.id === dispatchedAction.payload.sessionId
      ) {
        deleteRequestId.current = dispatchedAction.meta.requestId
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

  const shouldOpen =
    useSelector((state: State) =>
      createRequestId.current
        ? RobotApi.getRequestById(state, createRequestId.current)
        : null
    )?.status === RobotApi.SUCCESS

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

  const deckCalibrationSession = useSelector((state: State) => {
    const session: Sessions.Session | null = Sessions.getRobotSessionOfType(
      state,
      robotName,
      Sessions.SESSION_TYPE_DECK_CALIBRATION
    )
    if (
      session &&
      session.sessionType === Sessions.SESSION_TYPE_DECK_CALIBRATION
    ) {
      return session
    }
    return null
  })

  const {
    showConfirmation: showConfirmStart,
    confirm: confirmStart,
    cancel: cancelStart,
  } = useConditionalConfirm(() => {
    handleStartDeckCalSession()
  }, true)

  let warningType = null
  if (deckCalStatus && deckCalStatus !== DECK_CAL_STATUS_OK) {
    warningType = REQUIRED
  } else if (!Array.isArray(deckCalData) && deckCalData?.status && deckCalData.status.markedBad) {
    warningType = RECOMMENDED
  }

  return (
    <>
      <TitledControl
        borderBottom={BORDER_SOLID_LIGHT}
        title={CALIBRATE_TITLE_TEXT}
        description={
          <>
            <InlineCalibrationWarning
              warningType={warningType}
            />
            <Text>{CALIBRATE_DECK_DESCRIPTION}</Text>
          </>
        }
        control={
          <SecondaryBtn
            {...targetProps}
            width="9rem"
            onClick={confirmStart}
            disabled={disabledReason}
          >
            {CALIBRATE_BUTTON_TEXT}
          </SecondaryBtn>
        }
      >
        {disabledReason !== null && (
          <Tooltip {...tooltipProps}>{disabledReason}</Tooltip>
        )}

        {deckCalData && deckCalStatus && (
          <Text marginTop={SPACING_4} fontStyle={FONT_STYLE_ITALIC}>
            {buildDeckLastCalibrated(deckCalData, deckCalStatus)}
          </Text>
        )}
      </TitledControl>
      {showConfirmStart && (
        <Portal>
          <ConfirmStartDeckCalModal
            confirm={confirmStart}
            cancel={cancelStart}
          />
        </Portal>
      )}
      {showWizard && (
        <Portal>
          <CalibrateDeck
            session={deckCalibrationSession}
            robotName={robotName}
            closeWizard={() => setShowWizard(false)}
            dispatchRequests={dispatchRequests}
            showSpinner={showSpinner}
          />
        </Portal>
      )}
    </>
  )
}
