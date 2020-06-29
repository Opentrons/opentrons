// @flow
// Tip Length Calibration Orchestration Component
import * as React from 'react'

import { useDispatchApiRequest } from '../../robot-api'
import * as Sessions from '../../sessions'
import type {
  SessionCommandData,
  SessionCommandString,
} from '../../sessions/types'
import { CalibrationInfoBox } from '../CalibrationInfoBox'
import { CompleteConfirmation } from './CompleteConfirmation'
import { DeckSetup } from './DeckSetup'
import { InspectingTip } from './InspectingTip'
import { Introduction } from './Introduction'
import { MeasureNozzle } from './MeasureNozzle'
import { MeasureTip } from './MeasureTip'
import { TipPickUp } from './TipPickUp'
import type {
  CalibrateTipLengthChildProps,
  CalibrateTipLengthParentProps,
} from './types'
import { UncalibratedInfo } from './UncalibratedInfo'

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
export function CalibrateTipLength(
  props: CalibrateTipLengthParentProps
): React.Node {
  const { mount, probed, session } = props
  // TODO: get real session
  const tipLengthCalSession = session || {}
  // TODO: get real currentStep from session
  const currentStep = session?.details?.currentStep || ''
  const robotName = ''

  const title = `${mount} pipette calibration`
  const Panel = PANEL_BY_STEP[currentStep]

  const [dispatchRequest] = useDispatchApiRequest()

  function sendCommand(
    command: SessionCommandString,
    data: SessionCommandData = {}
  ) {
    tipLengthCalSession.id &&
      dispatchRequest(
        Sessions.createSessionCommand(robotName, tipLengthCalSession.id, {
          command,
          data,
        })
      )
  }
  return (
    <>
      <CalibrationInfoBox confirmed={probed} title={title}>
        {Panel ? (
          <Panel {...props} sendSessionCommand={sendCommand} />
        ) : (
          <UncalibratedInfo {...props} sendSessionCommand={sendCommand} />
        )}
      </CalibrationInfoBox>
    </>
  )
}
