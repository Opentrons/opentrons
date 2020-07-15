// @flow
// Tip Length Calibration Orchestration Component
import * as React from 'react'

import { ModalPage } from '@opentrons/components'

import type {
  SessionCommandString,
  SessionCommandData,
} from '../../sessions/types'
import * as Sessions from '../../sessions'
import { useDispatchApiRequest } from '../../robot-api'
import { CalibrationInfoBox } from '../CalibrationInfoBox'

import { UncalibratedInfo } from './UncalibratedInfo'
import { Introduction } from './Introduction'
import { DeckSetup } from './DeckSetup'
import { MeasureNozzle } from './MeasureNozzle'
import { TipPickUp } from './TipPickUp'
import { InspectingTip } from './InspectingTip'
import { MeasureTip } from './MeasureTip'
import { CompleteConfirmation } from './CompleteConfirmation'
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
  inspectingTip: InspectingTip,
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
  const { session, robotName, hasBlock } = props
  const currentStep = session?.details?.currentStep
  const Panel = PANEL_BY_STEP[currentStep]

  const [dispatchRequest] = useDispatchApiRequest()

  function sendCommand(
    command: SessionCommandString,
    data: SessionCommandData = {}
  ) {
    session &&
      session.id &&
      dispatchRequest(
        Sessions.createSessionCommand(robotName, session.id, {
          command,
          data,
        })
      )
  }
  return Panel ? (
    <ModalPage
      titleBar={{
        title: TIP_LENGTH_CALIBRATION_SUBTITLE,
        back: {
          onClick: () => console.log('TODO: handle confirm exit'),
          title: EXIT,
          children: EXIT,
        },
      }}
      contentsClassName={PANEL_STYLE_BY_STEP[currentStep]}
    >
      <Panel {...props} hasBlock={hasBlock} sendSessionCommand={sendCommand} />
    </ModalPage>
  ) : null
}
