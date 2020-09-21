// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  Text,
  SecondaryBtn,
  BORDER_SOLID_LIGHT,
  SPACING_2,
  useConditionalConfirm,
} from '@opentrons/components'

import { getFeatureFlags } from '../../config'
import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'

import type { State } from '../../types'
import type {
  DeckCalibrationStatus,
  DeckCalibrationData,
} from '../../calibration/types'
import type { SessionCommandString } from '../../sessions/types'
import type { RequestState } from '../../robot-api/types'

import { Portal } from '../portal'
import { TitledControl } from '../TitledControl'
import { CalibrateDeck } from '../CalibrateDeck'
import { DeckCalibrationWarning } from './DeckCalibrationWarning'
import { ConfirmStartDeckCalModal } from './ConfirmStartDeckCalModal'
import { DeckCalibrationDownload } from './DeckCalibrationDownload'

type Props = {|
  robotName: string,
  buttonDisabled: boolean,
  deckCalStatus: DeckCalibrationStatus | null,
  deckCalData: DeckCalibrationData | null,
  startLegacyDeckCalibration: () => void,
|}

// deck calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: Array<SessionCommandString> = [
  Sessions.sharedCalCommands.JOG,
]

const CALIBRATE_DECK_DESCRIPTION =
  "Calibrate the position of the robot's deck. Recommended for all new robots and after moving robots."
const CALIBRATE_BUTTON_TEXT = 'Calibrate'
const CALIBRATE_TITLE_TEXT = 'Calibrate deck'

export function DeckCalibrationControl(props: Props): React.Node {
  const {
    robotName,
    buttonDisabled,
    deckCalStatus,
    deckCalData,
    startLegacyDeckCalibration,
  } = props

  const [showWizard, setShowWizard] = React.useState(false)

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

  const ff = useSelector(getFeatureFlags)

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

  const handleButtonClick = ff.enableCalibrationOverhaul
    ? confirmStart
    : startLegacyDeckCalibration

  return (
    <>
      <TitledControl
        borderBottom={BORDER_SOLID_LIGHT}
        title={CALIBRATE_TITLE_TEXT}
        description={<Text>{CALIBRATE_DECK_DESCRIPTION}</Text>}
        control={
          <SecondaryBtn
            width="9rem"
            onClick={handleButtonClick}
            disabled={buttonDisabled}
          >
            {CALIBRATE_BUTTON_TEXT}
          </SecondaryBtn>
        }
      >
        <DeckCalibrationWarning
          deckCalibrationStatus={deckCalStatus}
          marginTop={SPACING_2}
        />
        <DeckCalibrationDownload
          deckCalibrationStatus={deckCalStatus}
          deckCalibrationData={deckCalData}
          robotName={robotName}
          marginTop={SPACING_2}
        />
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
