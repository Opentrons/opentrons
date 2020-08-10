// @flow
// Tip Length Calibration Orchestration Component
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import last from 'lodash/last'

import {
  ModalPage,
  SpinnerModalPage,
  useConditionalConfirm,
} from '@opentrons/components'

import type { State } from '../../types'
import type {
  SessionCommandString,
  SessionCommandData,
} from '../../sessions/types'
import * as Sessions from '../../sessions'
import { useDispatchApiRequest, getRequestById, PENDING } from '../../robot-api'
import type { RequestState } from '../../robot-api/types'
import { Introduction } from './Introduction'
import { DeckSetup } from './DeckSetup'
import { TipPickUp } from './TipPickUp'
import { TipConfirmation } from './TipConfirmation'
import { SaveZPoint } from './SaveZPoint'
import { SaveXYPoint } from './SaveXYPoint'
import { CompleteConfirmation } from './CompleteConfirmation'
import { ConfirmExitModal } from './ConfirmExitModal'
import styles from './styles.css'

import type { CalibrateDeckParentProps, CalibrateDeckChildProps } from './types'

const TIP_LENGTH_CALIBRATION_SUBTITLE = 'Deck calibration'
const EXIT = 'exit'

const PANEL_BY_STEP: {
  [string]: React.ComponentType<CalibrateDeckChildProps>,
} = {
  sessionStarted: Introduction,
  labwareLoaded: DeckSetup,
  preparingPipette: TipPickUp,
  inspectingTip: TipConfirmation,
  joggingToDeck: SaveZPoint,
  joggingToPointOne: SaveXYPoint,
  joggingToPointTwo: SaveXYPoint,
  joggingToPointThree: SaveXYPoint,
  calibrationComplete: CompleteConfirmation,
}
const PANEL_STYLE_BY_STEP: {
  [string]: string,
} = {
  sessionStarted: styles.terminal_modal_contents,
  labwareLoaded: styles.page_content_dark,
  preparingPipette: styles.modal_contents,
  inspectingTip: styles.modal_contents,
  joggingToDeck: styles.modal_contents,
  joggingToPointOne: styles.modal_contents,
  joggingToPointTwo: styles.modal_contents,
  joggingToPointThree: styles.modal_contents,
  calibrationComplete: styles.terminal_modal_contents,
}
export function CalibrateDeck(props: CalibrateDeckParentProps): React.Node {
  const { session, robotName, closeWizard } = props
  const [dispatchRequest, requestIds] = useDispatchApiRequest()
  const dispatch = useDispatch()

  const requestStatus = useSelector<State, RequestState | null>(state =>
    getRequestById(state, last(requestIds))
  )?.status

  function sendCommand(
    command: SessionCommandString,
    data: SessionCommandData = {},
    loadingSpinner: boolean = true
  ) {
    if (session === null) return
    const sessionCommand = Sessions.createSessionCommand(
      robotName,
      session.id,
      { command, data }
    )
    if (loadingSpinner) {
      dispatchRequest(sessionCommand)
    } else {
      dispatch(sessionCommand)
    }
  }

  function deleteSession() {
    session?.id &&
      dispatchRequest(Sessions.deleteSession(robotName, session.id))
    closeWizard()
  }

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {
    sendCommand(Sessions.tipCalCommands.EXIT)
    deleteSession()
  }, true)

  if (!session) {
    return null
  }

  const titleBarProps = {
    title: TIP_LENGTH_CALIBRATION_SUBTITLE,
    back: { onClick: confirmExit, title: EXIT, children: EXIT },
  }

  if (requestStatus === PENDING) {
    return <SpinnerModalPage titleBar={titleBarProps} />
  }

  const { currentStep } = session?.details
  // TODO: IMMEDIATELY pull actual tipRack, isMulti, and mount from session details
  const tipRack = {}
  const isMulti = false
  const mount = 'left'
  const Panel = PANEL_BY_STEP[currentStep]

  return Panel ? (
    <>
      <ModalPage
        titleBar={titleBarProps}
        contentsClassName={PANEL_STYLE_BY_STEP[currentStep]}
      >
        <Panel
          sendSessionCommand={sendCommand}
          deleteSession={deleteSession}
          tipRack={tipRack}
          isMulti={isMulti}
          mount={mount}
        />
      </ModalPage>
      {showConfirmExit && (
        <ConfirmExitModal exit={confirmExit} back={cancelExit} />
      )}
    </>
  ) : null
}
