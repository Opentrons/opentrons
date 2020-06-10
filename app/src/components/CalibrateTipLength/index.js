// @flow
// TipProbe controls
import * as React from 'react'

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

import type {
  CalibrateTipLengthParentProps,
  CalibrateTipLengthChildProps,
} from './types'

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
