// @flow
// Pipette Offset Calibration Orchestration Component
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import {
  ModalPage,
  SpinnerModalPage,
  useConditionalConfirm,
} from '@opentrons/components'

import type { State } from '../../types'
import type {
  SessionCommandString,
  SessionCommandData,
  DeckCalibrationLabware,
} from '../../sessions/types'
import * as Sessions from '../../sessions'
import {
  useDispatchApiRequests,
  getRequestById,
  PENDING,
} from '../../robot-api'
import type { RequestState } from '../../robot-api/types'
import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
  SaveZPoint,
  SaveXYPoint,
  CompleteConfirmation,
  ConfirmExitModal,
} from '../CalibrationPanels'
import styles from '../CalibrateDeck/styles.css'

import type { CalibratePipetteOffsetParentProps, CommandToSend } from './types'
import type { CalibrationPanelProps } from '../CalibrationPanels/types'

// session commands for which the full page spinner should not appear
const spinnerCommandBlockList: Array<SessionCommandString> = [
  Sessions.sharedCalCommands.JOG,
]

const PIPETTE_OFFSET_CALIBRATION_SUBTITLE = 'Pipette offset calibration'
const EXIT = 'exit'

const PANEL_BY_STEP: {
  [string]: React.ComponentType<CalibrationPanelProps>,
} = {
  [Sessions.PIP_OFFSET_STEP_SESSION_STARTED]: Introduction,
  [Sessions.PIP_OFFSET_STEP_LABWARE_LOADED]: DeckSetup,
  [Sessions.PIP_OFFSET_STEP_PREPARING_PIPETTE]: TipPickUp,
  [Sessions.PIP_OFFSET_STEP_INSPECTING_TIP]: TipConfirmation,
  [Sessions.PIP_OFFSET_STEP_JOGGING_TO_DECK]: SaveZPoint,
  [Sessions.PIP_OFFSET_STEP_SAVING_POINT_ONE]: SaveXYPoint,
  [Sessions.PIP_OFFSET_STEP_CALIBRATION_COMPLETE]: CompleteConfirmation,
}
const PANEL_STYLE_BY_STEP: {
  [string]: string,
} = {
  [Sessions.PIP_OFFSET_STEP_SESSION_STARTED]: styles.terminal_modal_contents,
  [Sessions.PIP_OFFSET_STEP_LABWARE_LOADED]: styles.page_content_dark,
  [Sessions.PIP_OFFSET_STEP_PREPARING_PIPETTE]: styles.modal_contents,
  [Sessions.PIP_OFFSET_STEP_INSPECTING_TIP]: styles.modal_contents,
  [Sessions.PIP_OFFSET_STEP_JOGGING_TO_DECK]: styles.modal_contents,
  [Sessions.PIP_OFFSET_STEP_SAVING_POINT_ONE]: styles.modal_contents,
  [Sessions.PIP_OFFSET_STEP_CALIBRATION_COMPLETE]:
    styles.terminal_modal_contents,
}
export function CalibratePipetteOffset(
  props: CalibratePipetteOffsetParentProps
): React.Node {
  const { session, robotName, closeWizard } = props
  const { currentStep, instrument, labware } = session?.details || {}
  const trackedRequestId = React.useRef<string | null>(null)
  const [dispatchRequests, requestIds] = useDispatchApiRequests(
    dispatchedAction => {
      if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(dispatchedAction.payload.command)
      ) {
        trackedRequestId.current = dispatchedAction.meta.requestId
      }
    }
  )
  const dispatch = useDispatch()

  const showSpinner =
    useSelector<State, RequestState | null>(state =>
      getRequestById(state, trackedRequestId.current)
    )?.status === PENDING

  function sendCommands(...comms: Array<CommandToSend>) {
    if (session === null) return
    const sessionCommands = comms.map(c =>
      Sessions.createSessionCommand(robotName, session.id, {
        command: c.command,
        data: c.data || {},
      })
    )
    dispatchRequests(...sessionCommands)
  }

  function deleteSession() {
    session?.id &&
      dispatchRequests(Sessions.deleteSession(robotName, session.id))
    closeWizard()
  }

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {
    dispatchRequests(
      Sessions.createSessionCommand(robotName, session.id, {
        command: Sessions.deckCalCommands.EXIT,
        data: {},
      }),
      Sessions.deleteSession(robotName, session.id)
    )
    closeWizard()
  }, true)

  const isMulti = React.useMemo(() => {
    const spec = instrument && getPipetteModelSpecs(instrument.model)
    return spec ? spec.channels > 1 : false
  }, [instrument])

  const tipRack: DeckCalibrationLabware | null =
    (labware && labware.find(l => l.isTiprack)) ?? null

  if (!session || !tipRack) {
    return null
  }

  const titleBarProps = {
    title: PIPETTE_OFFSET_CALIBRATION_SUBTITLE,
    back: { onClick: confirmExit, title: EXIT, children: EXIT },
  }

  if (showSpinner) {
    return <SpinnerModalPage titleBar={titleBarProps} />
  }

  const Panel = PANEL_BY_STEP[currentStep]
  return Panel ? (
    <>
      <ModalPage
        titleBar={titleBarProps}
        contentsClassName={PANEL_STYLE_BY_STEP[currentStep]}
      >
        <Panel
          sendSessionCommand={sendCommands}
          deleteSession={deleteSession}
          tipRack={tipRack}
          isMulti={isMulti}
          mount={instrument?.mount.toLowerCase()}
          currentStep={currentStep}
          sessionType={session.sessionType}
        />
      </ModalPage>
      {showConfirmExit && (
        <ConfirmExitModal
          exit={confirmExit}
          back={cancelExit}
          sessionType={session.sessionType}
        />
      )}
    </>
  ) : null
}
