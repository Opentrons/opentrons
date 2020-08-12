// @flow
// Tip Length Calibration Orchestration Component
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import last from 'lodash/last'

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
  TipLengthCalibrationLabware,
} from '../../sessions/types'
import * as Sessions from '../../sessions'
import { useDispatchApiRequest, getRequestById, PENDING } from '../../robot-api'
import type { RequestState, RequestStatus } from '../../robot-api/types'
import { Introduction } from './Introduction'
import { DeckSetup } from './DeckSetup'
import { MeasureNozzle } from './MeasureNozzle'
import { TipPickUp } from './TipPickUp'
import { TipConfirmation } from './TipConfirmation'
import { MeasureTip } from './MeasureTip'
import { CompleteConfirmation } from './CompleteConfirmation'
import { ConfirmExitModal } from './ConfirmExitModal'
import styles from './styles.css'

import type {
  CalibrateTipLengthParentProps,
  CalibrateTipLengthChildProps,
} from './types'

export { AskForCalibrationBlockModal } from './AskForCalibrationBlockModal'

const TIP_LENGTH_CALIBRATION_SUBTITLE = 'Tip length calibration'
const EXIT = 'exit'

const PANEL_BY_STEP: {
  [string]: React.ComponentType<CalibrateTipLengthChildProps>,
} = {
  sessionStarted: Introduction,
  labwareLoaded: DeckSetup,
  measuringNozzleOffset: MeasureNozzle,
  preparingPipette: TipPickUp,
  inspectingTip: TipConfirmation,
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
  calibrationComplete: styles.terminal_modal_contents,
}
export function CalibrateTipLength(
  props: CalibrateTipLengthParentProps
): React.Node {
  const { session, robotName, hasBlock, closeWizard } = props
  const { currentStep, instrument, labware } = session?.details || {}
  const [dispatchRequest, requestIds] = useDispatchApiRequest()
  const dispatch = useDispatch()

  const lastRequestStatus: RequestStatus | null =
    useSelector<State, RequestState | null>(state =>
      getRequestById(state, last(requestIds))
    )?.status ?? null

  const isMulti = React.useMemo(() => {
    const spec = instrument && getPipetteModelSpecs(instrument.model)
    return spec ? spec.channels > 1 : false
  }, [instrument])

  const tipRack: TipLengthCalibrationLabware | null =
    (labware && labware.find(l => l.isTiprack)) ?? null
  const calBlock: TipLengthCalibrationLabware | null =
    hasBlock && labware ? labware.find(l => !l.isTiprack) ?? null : null

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

  if (!session || !tipRack) {
    return null
  }

  const titleBarProps = {
    title: TIP_LENGTH_CALIBRATION_SUBTITLE,
    back: { onClick: confirmExit, title: EXIT, children: EXIT },
  }

  if (lastRequestStatus === PENDING) {
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
          isMulti={isMulti}
          mount={instrument?.mount.toLowerCase()}
          tipRack={tipRack}
          calBlock={calBlock}
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
