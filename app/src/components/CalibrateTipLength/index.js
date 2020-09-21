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
  DISPLAY_FLEX,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  SPACING_3,
  C_TRANSPARENT,
  ALIGN_FLEX_START,
  C_WHITE,
} from '@opentrons/components'

import type { State } from '../../types'
import type { StyleProps } from '@opentrons/components'
import type {
  SessionCommandParams,
  TipLengthCalibrationLabware,
} from '../../sessions/types'
import * as Sessions from '../../sessions'
import type { CalibrationPanelProps } from '../CalibrationPanels/types'

import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
  CompleteConfirmation,
  ConfirmExitModal,
} from '../CalibrationPanels'
import { MeasureNozzle } from './MeasureNozzle'
import { MeasureTip } from './MeasureTip'
import styles from './styles.css'

import type { CalibrateTipLengthParentProps } from './types'

export { AskForCalibrationBlockModal } from './AskForCalibrationBlockModal'

const TIP_LENGTH_CALIBRATION_SUBTITLE = 'Tip length calibration'
const EXIT = 'exit'

const darkContentsStyleProps = {
  display: DISPLAY_FLEX,
  flexDirection: DIRECTION_COLUMN,
  alignItems: ALIGN_CENTER,
  padding: SPACING_3,
  backgroundColor: C_TRANSPARENT,
  height: '100%',
}
const contentsStyleProps = {
  display: DISPLAY_FLEX,
  backgroundColor: C_WHITE,
  flexDirection: DIRECTION_COLUMN,
  justifyContent: JUSTIFY_CENTER,
  alignItems: ALIGN_FLEX_START,
  padding: SPACING_3,
  maxWidth: '48rem',
  minHeight: '14rem',
}

const terminalContentsStyleProps = {
  ...contentsStyleProps,
  paddingX: '1.5rem',
}

const PANEL_BY_STEP: {
  [string]: React.ComponentType<CalibrationPanelProps>,
} = {
  sessionStarted: Introduction,
  labwareLoaded: DeckSetup,
  measuringNozzleOffset: MeasureNozzle,
  preparingPipette: TipPickUp,
  inspectingTip: TipConfirmation,
  measuringTipOffset: MeasureTip,
  calibrationComplete: CompleteConfirmation,
}
const PANEL_STYLE_PROPS_BY_STEP: {
  [string]: StyleProps,
} = {
  [Sessions.TIP_LENGTH_STEP_SESSION_STARTED]: terminalContentsStyleProps,
  [Sessions.TIP_LENGTH_STEP_LABWARE_LOADED]: darkContentsStyleProps,
  [Sessions.TIP_LENGTH_STEP_PREPARING_PIPETTE]: contentsStyleProps,
  [Sessions.TIP_LENGTH_STEP_INSPECTING_TIP]: contentsStyleProps,
  [Sessions.TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET]: contentsStyleProps,
  [Sessions.TIP_LENGTH_STEP_MEASURING_TIP_OFFSET]: contentsStyleProps,
  [Sessions.TIP_LENGTH_STEP_CALIBRATION_COMPLETE]: terminalContentsStyleProps,
}
export function CalibrateTipLength(
  props: CalibrateTipLengthParentProps
): React.Node {
  const {
    session,
    robotName,
    hasBlock,
    closeWizard,
    showSpinner,
    dispatchRequests,
  } = props
  const { currentStep, instrument, labware } = session?.details || {}

  const isMulti = React.useMemo(() => {
    const spec = instrument && getPipetteModelSpecs(instrument.model)
    return spec ? spec.channels > 1 : false
  }, [instrument])

  const tipRack: TipLengthCalibrationLabware | null =
    (labware && labware.find(l => l.isTiprack)) ?? null
  const calBlock: TipLengthCalibrationLabware | null =
    hasBlock && labware ? labware.find(l => !l.isTiprack) ?? null : null

  function sendCommands(...commands: Array<SessionCommandParams>) {
    if (session?.id) {
      const sessionCommandActions = commands.map(c =>
        Sessions.createSessionCommand(robotName, session.id, {
          command: c.command,
          data: c.data || {},
        })
      )
      dispatchRequests(...sessionCommandActions)
    }
  }

  function cleanUpAndExit() {
    if (session?.id) {
      dispatchRequests(
        Sessions.createSessionCommand(robotName, session.id, {
          command: Sessions.sharedCalCommands.EXIT,
          data: {},
        }),
        Sessions.deleteSession(robotName, session.id)
      )
    }
    closeWizard()
  }

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {
    cleanUpAndExit()
  }, true)

  if (!session || !tipRack) {
    return null
  }

  const titleBarProps = {
    title: TIP_LENGTH_CALIBRATION_SUBTITLE,
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
        innerProps={PANEL_STYLE_PROPS_BY_STEP[currentStep]}
      >
        <Panel
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          isMulti={isMulti}
          mount={instrument?.mount.toLowerCase()}
          tipRack={tipRack}
          calBlock={calBlock}
          currentStep={currentStep}
          sessionType={session.sessionType}
        />
      </ModalPage>
      {showConfirmExit && (
        <ConfirmExitModal exit={confirmExit} back={cancelExit} />
      )}
    </>
  ) : null
}
