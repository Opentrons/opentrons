// Tip Length Calibration Orchestration Component
import * as React from 'react'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { SpinnerModalPage, useConditionalConfirm } from '@opentrons/components'

import * as Sessions from '../../redux/sessions'
import {
  CompleteConfirmation,
  ConfirmExitModal,
  MeasureNozzle,
  MeasureTip,
  INTENT_TIP_LENGTH_IN_PROTOCOL,
} from '../../organisms/DeprecatedCalibrationPanels'
import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
} from '../../organisms/CalibrationPanels'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { Portal } from '../../App/portal'

import type { Mount } from '@opentrons/components'
import type {
  SessionCommandParams,
  CalibrationLabware,
  CalibrationSessionStep,
} from '../../redux/sessions/types'
import type { CalibrationPanelProps } from '../../organisms/DeprecatedCalibrationPanels/types'
import type { CalibrateTipLengthParentProps } from './types'

export { AskForCalibrationBlockModal } from './AskForCalibrationBlockModal'
export { ConfirmRecalibrationModal } from './ConfirmRecalibrationModal'

const TIP_LENGTH_CALIBRATION_SUBTITLE = 'Tip length calibration'
const EXIT = 'exit'

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
  if (Panel == null) return null
  return (
    <Portal level="top">
      <ModalShell
        width="47rem"
        header={
          <WizardHeader
            title={TIP_LENGTH_CALIBRATION_SUBTITLE}
            currentStep={1}
            totalSteps={5}
            onExit={confirmExit}
          />
        }
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
      </ModalShell>
      {showConfirmExit && (
        // @ts-expect-error TODO: ConfirmExitModal expects sessionType
        <ConfirmExitModal exit={confirmExit} back={cancelExit} />
      )}
    </Portal>
  )
}
