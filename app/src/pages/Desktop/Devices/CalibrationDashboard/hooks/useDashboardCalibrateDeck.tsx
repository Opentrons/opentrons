import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { ModalShell } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { WizardHeader } from '/app/molecules/WizardHeader'
import { CalibrateDeck } from '/app/organisms/Desktop/CalibrateDeck'
import { LoadingState } from '/app/organisms/Desktop/CalibrationPanels'
import * as RobotApi from '/app/redux/robot-api'
import * as Sessions from '/app/redux/sessions'
import { getDeckCalibrationSession } from '/app/redux/sessions/deck-calibration/selectors'

import type { State } from '/app/redux/types'
import type { DashboardCalDeckInvoker } from '/app/organisms/Desktop/Devices/hooks/useCalibrationTaskList'
import type { DeckCalibrationSession } from '/app/redux/sessions'
import type { SessionCommandString } from '/app/redux/sessions/types'
import type { RequestState } from '/app/redux/robot-api/types'

// deck calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export function useDashboardCalibrateDeck(
  robotName: string
): [DashboardCalDeckInvoker, JSX.Element | null, boolean] {
  const trackedRequestId = useRef<string | null>(null)
  const createRequestId = useRef<string | null>(null)
  const jogRequestId = useRef<string | null>(null)
  const exitBeforeDeckConfigCompletion = useRef<boolean>(false)
  const invalidateHandlerRef = useRef<(() => void) | undefined>()
  const { t } = useTranslation('robot_calibration')

  const deckCalSession: DeckCalibrationSession | null = useSelector(
    (state: State) => {
      return getDeckCalibrationSession(state, robotName)
    }
  )

  const [dispatchRequests, requestIds] = RobotApi.useDispatchApiRequests(
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

  const handleStartDashboardDeckCalSession: DashboardCalDeckInvoker = (
    props = {}
  ) => {
    invalidateHandlerRef.current = props.invalidateHandler
    dispatchRequests(
      Sessions.ensureSession(robotName, Sessions.SESSION_TYPE_DECK_CALIBRATION)
    )
  }

  let Wizard: JSX.Element | null = createPortal(
    startingSession ? (
      <ModalShell
        width="47rem"
        header={<WizardHeader title={t('deck_calibration')} />}
      >
        <LoadingState />
      </ModalShell>
    ) : (
      <CalibrateDeck
        session={deckCalSession}
        robotName={robotName}
        showSpinner={showSpinner}
        dispatchRequests={dispatchRequests}
        requestIds={requestIds}
        isJogging={isJogging}
        exitBeforeDeckConfigCompletion={exitBeforeDeckConfigCompletion}
        offsetInvalidationHandler={invalidateHandlerRef.current}
      />
    ),
    getTopPortalEl()
  )

  if (!(startingSession || deckCalSession != null)) Wizard = null

  return [
    handleStartDashboardDeckCalSession,
    Wizard,
    exitBeforeDeckConfigCompletion.current,
  ]
}
