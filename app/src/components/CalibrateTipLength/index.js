// @flow
// Tip Length Calibration Orchestration Component
import * as React from 'react'

import { ModalPage, TitleBarProps } from '@opentrons/components'

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
export function CalibrateTipLength(
  props: CalibrateTipLengthParentProps
): React.Node {
  const { mount, probed, session } = props
  // TODO: get real session
  const tipLengthCalSession = session || {}
  // TODO: get real currentStep from session
  const currentStep = session?.details?.currentStep || ''
  const robotName = ''
  // TODO: get real block setting
  const hasBlock = true
  const title = `${mount} pipette tip length calibration`
  const Panel = PANEL_BY_STEP[currentStep]

  const [dispatchRequest] = useDispatchApiRequest()

  const shouldDisplayTitleBarExit = true

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
      {Panel ? (
        <ModalPage
          titleBar={{
            title: TIP_LENGTH_CALIBRATION_SUBTITLE,
            back: {
              onClick: () => console.log('TODO: handle confirm exit'),
              title: EXIT,
              children: EXIT,
            },
          }}
          contentsClassName={styles.terminal_modal_contents}
        >
          <Panel
            {...props}
            hasBlock={hasBlock}
            sendSessionCommand={sendCommand}
          />
        </ModalPage>
      ) : (
        <CalibrationInfoBox confirmed={probed} title={title}>
          <UncalibratedInfo {...props} sendSessionCommand={sendCommand} />
        </CalibrationInfoBox>
      )}
    </>
  )
}
