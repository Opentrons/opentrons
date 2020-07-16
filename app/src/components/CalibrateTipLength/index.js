// @flow
// Tip Length Calibration Orchestration Component
import * as React from 'react'

import { ModalPage, useConditionalConfirm } from '@opentrons/components'

import type {
  SessionCommandString,
  SessionCommandData,
} from '../../sessions/types'
import * as Sessions from '../../sessions'
import { useDispatchApiRequest } from '../../robot-api'

import { Introduction } from './Introduction'
import { DeckSetup } from './DeckSetup'
import { MeasureNozzle } from './MeasureNozzle'
import { TipPickUp } from './TipPickUp'
import { MeasureTip } from './MeasureTip'
import { CompleteConfirmation } from './CompleteConfirmation'
import { ConfirmExitModal } from './ConfirmExitModal'
import styles from './styles.css'

import type {
  CalibrateTipLengthParentProps,
  CalibrateTipLengthChildProps,
} from './types'

const TIP_LENGTH_CALIBRATION_SUBTITLE = 'Tip length calibration'
const EXIT = 'exit'

const PANEL_BY_STEP: {
  [string]: React.ComponentType<CalibrateTipLengthChildProps>,
} = {
  sessionStarted: Introduction,
  labwareLoaded: DeckSetup,
  measuringNozzleOffset: MeasureNozzle,
  preparingPipette: TipPickUp,
  measuringTipOffset: MeasureTip,
  calibrationComplete: CompleteConfirmation,
}
const PANEL_STYLE_BY_STEP: {
  [string]: string,
} = {
  sessionStarted: styles.terminal_modal_contents,
  labwareLoaded: styles.page_content_dark,
  measuringNozzleOffset: styles.modal_contents,
  preparingPipette: styles.modal_contents,
  inspectingTip: styles.modal_contents,
  measuringTipOffset: styles.modal_contents,
  calibrationComplete: styles.modal_contents,
}
export function CalibrateTipLength(
  props: CalibrateTipLengthParentProps
): React.Node {
  const { session, robotName, hasBlock, closeWizard } = props
  const [dispatchRequest] = useDispatchApiRequest()

  function sendCommand(
    command: SessionCommandString,
    data: SessionCommandData = {}
  ) {
    session?.id &&
      dispatchRequest(
        Sessions.createSessionCommand(robotName, session.id, {
          command,
          data,
        })
      )
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
  const { currentStep, instrument, labware } = session?.details
  const Panel = PANEL_BY_STEP[currentStep]

  return Panel ? (
    <>
      <ModalPage
        titleBar={{
          title: TIP_LENGTH_CALIBRATION_SUBTITLE,
          back: { onClick: confirmExit, title: EXIT, children: EXIT },
        }}
        contentsClassName={PANEL_STYLE_BY_STEP[currentStep]}
      >
        <Panel
          instrument={instrument}
          labware={labware}
          hasBlock={hasBlock}
          sendSessionCommand={sendCommand}
          deleteSession={deleteSession}
        />
      </ModalPage>
      {showConfirmExit && (
        <ConfirmExitModal exit={confirmExit} back={cancelExit} />
      )}
    </>
  ) : null
}
