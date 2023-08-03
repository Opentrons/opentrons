import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { Portal } from '../../../../App/portal'
import { LegacyModalShell } from '../../../../molecules/LegacyModal'
import { WizardHeader } from '../../../../molecules/WizardHeader'
import { CalibrateDeck } from '../../../../organisms/CalibrateDeck'
import { LoadingState } from '../../../../organisms/CalibrationPanels'
import * as RobotApi from '../../../../redux/robot-api'
import * as Sessions from '../../../../redux/sessions'
import { getDeckCalibrationSession } from '../../../../redux/sessions/deck-calibration/selectors'

import type { State } from '../../../../redux/types'
import type { DeckCalibrationSession } from '../../../../redux/sessions'
import type { SessionCommandString } from '../../../../redux/sessions/types'
import type { RequestState } from '../../../../redux/robot-api/types'

// deck calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]
export interface DashboardCalDeckInvokerProps {
  invalidateHandler?: () => void
}
export type DashboardCalDeckInvoker = (
  props?: DashboardCalDeckInvokerProps
) => void

export function useDashboardCalibrateDeck(
  robotName: string
): [DashboardCalDeckInvoker, JSX.Element | null] {
  const trackedRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)
  const invalidateHandlerRef = React.useRef<(() => void) | undefined>()
  const { t } = useTranslation('robot_calibration')

  const deckCalSession: DeckCalibrationSession | null = useSelector(
    (state: State) => {
      return getDeckCalibrationSession(state, robotName)
    }
  )

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

  let Wizard: JSX.Element | null = (
    <Portal level="top">
      {startingSession ? (
        <LegacyModalShell
          width="47rem"
          header={<WizardHeader title={t('deck_calibration')} />}
        >
          <LoadingState />
        </LegacyModalShell>
      ) : (
        <CalibrateDeck
          session={deckCalSession}
          robotName={robotName}
          showSpinner={showSpinner}
          dispatchRequests={dispatchRequests}
          isJogging={isJogging}
          offsetInvalidationHandler={invalidateHandlerRef.current}
        />
      )}
    </Portal>
  )

  if (!(startingSession || deckCalSession != null)) Wizard = null

  return [handleStartDashboardDeckCalSession, Wizard]
}
