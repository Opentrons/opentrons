// Tip Length Calibration Orchestration Component
import * as React from 'react'

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

import * as Sessions from '../../redux/sessions'

import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
  CompleteConfirmation,
  ConfirmExitModal,
  MeasureNozzle,
  MeasureTip,
  INTENT_TIP_LENGTH_IN_PROTOCOL,
} from '../../organisms/CalibrationPanels'

import type { StyleProps, Mount } from '@opentrons/components'
import type {
  SessionCommandParams,
  CalibrationLabware,
  CalibrationSessionStep,
} from '../../redux/sessions/types'
import type { CalibrationPanelProps } from '../../organisms/CalibrationPanels/types'
import type { CalibrateTipLengthParentProps } from './types'

export { AskForCalibrationBlockModal } from './AskForCalibrationBlockModal'
export { ConfirmRecalibrationModal } from './ConfirmRecalibrationModal'

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

const PANEL_BY_STEP: Partial<
  Record<CalibrationSessionStep, React.ComponentType<CalibrationPanelProps>>
> = {
  sessionStarted: Introduction,
  labwareLoaded: DeckSetup,
  measuringNozzleOffset: MeasureNozzle,
  preparingPipette: TipPickUp,
  inspectingTip: TipConfirmation,
  measuringTipOffset: MeasureTip,
  calibrationComplete: CompleteConfirmation,
}
const PANEL_STYLE_PROPS_BY_STEP: Partial<
  Record<CalibrationSessionStep, StyleProps>
> = {
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
): JSX.Element | null {
  const { session, robotName, showSpinner, dispatchRequests, isJogging } = props
  const { currentStep, instrument, labware } = session?.details || {}

  const isMulti = React.useMemo(() => {
    const spec = instrument && getPipetteModelSpecs(instrument.model)
    return spec ? spec.channels > 1 : false
  }, [instrument])

  const tipRack: CalibrationLabware | null =
    (labware && labware.find(l => l.isTiprack)) ?? null
  const calBlock: CalibrationLabware | null = labware
    ? labware.find(l => !l.isTiprack) ?? null
    : null

  function sendCommands(...commands: SessionCommandParams[]): void {
    if (session?.id && !isJogging) {
      const sessionCommandActions = commands.map(c =>
        Sessions.createSessionCommand(robotName, session.id, {
          command: c.command,
          data: c.data || {},
        })
      )
      dispatchRequests(...sessionCommandActions)
    }
  }

  function cleanUpAndExit(): void {
    if (session?.id) {
      dispatchRequests(
        Sessions.createSessionCommand(robotName, session.id, {
          command: Sessions.sharedCalCommands.EXIT,
          data: {},
        }),
        Sessions.deleteSession(robotName, session.id)
      )
    }
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
  // @ts-expect-error(sa, 2021-05-26): cannot index undefined, leaving to avoid src code change
  const Panel = PANEL_BY_STEP[currentStep]

  return Panel ? (
    <>
      <ModalPage
        titleBar={titleBarProps}
        // @ts-expect-error(sa, 2021-05-26): cannot index undefined, leaving to avoid src code change
        innerProps={PANEL_STYLE_PROPS_BY_STEP[currentStep]}
      >
        <Panel
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          isMulti={isMulti}
          mount={instrument?.mount.toLowerCase() as Mount}
          tipRack={tipRack}
          calBlock={calBlock}
          currentStep={currentStep}
          sessionType={session.sessionType}
          intent={INTENT_TIP_LENGTH_IN_PROTOCOL}
        />
      </ModalPage>
      {showConfirmExit && (
        // @ts-expect-error TODO: ConfirmExitModal expects sessionType
        <ConfirmExitModal exit={confirmExit} back={cancelExit} />
      )}
    </>
  ) : null
}
