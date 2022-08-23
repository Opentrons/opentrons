// Pipette Offset Calibration Orchestration Component
import * as React from 'react'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import {
  Box,
  SpinnerModalPage,
  useConditionalConfirm,
  SPACING,
} from '@opentrons/components'

import * as Sessions from '../../redux/sessions'
import {
  TipPickUp,
  TipConfirmation,
  SaveZPoint,
  SaveXYPoint,
  CompleteConfirmation,
  ConfirmExitModal,
  MeasureNozzle,
  MeasureTip,
} from '../../organisms/DeprecatedCalibrationPanels'
import { Introduction, DeckSetup } from '../../organisms/CalibrationPanels'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { Portal } from '../../App/portal'

import type { Mount } from '@opentrons/components'
import type {
  CalibrationLabware,
  CalibrationSessionStep,
  SessionCommandParams,
} from '../../redux/sessions/types'
import type { CalibratePipetteOffsetParentProps } from './types'
import type { CalibrationPanelProps } from '../../organisms/DeprecatedCalibrationPanels/types'

const PIPETTE_OFFSET_CALIBRATION_SUBTITLE = 'Pipette offset calibration'
const TIP_LENGTH_CALIBRATION_SUBTITLE = 'Tip length calibration'
const EXIT = 'exit'

const PANEL_BY_STEP: Partial<
  Record<CalibrationSessionStep, React.ComponentType<CalibrationPanelProps>>
> = {
  [Sessions.PIP_OFFSET_STEP_SESSION_STARTED]: Introduction,
  [Sessions.PIP_OFFSET_STEP_LABWARE_LOADED]: DeckSetup,
  [Sessions.PIP_OFFSET_STEP_MEASURING_NOZZLE_OFFSET]: MeasureNozzle,
  [Sessions.PIP_OFFSET_STEP_MEASURING_TIP_OFFSET]: MeasureTip,
  [Sessions.PIP_OFFSET_STEP_PREPARING_PIPETTE]: TipPickUp,
  [Sessions.PIP_OFFSET_STEP_INSPECTING_TIP]: TipConfirmation,
  [Sessions.PIP_OFFSET_STEP_JOGGING_TO_DECK]: SaveZPoint,
  [Sessions.PIP_OFFSET_STEP_SAVING_POINT_ONE]: SaveXYPoint,
  [Sessions.PIP_OFFSET_STEP_TIP_LENGTH_COMPLETE]: CompleteConfirmation,
  [Sessions.PIP_OFFSET_STEP_CALIBRATION_COMPLETE]: CompleteConfirmation,
}

export function CalibratePipetteOffset(
  props: CalibratePipetteOffsetParentProps
): JSX.Element | null {
  const {
    session,
    robotName,
    dispatchRequests,
    showSpinner,
    isJogging,
    intent,
  } = props
  const { currentStep, instrument, labware, supportedCommands } =
    session?.details || {}

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {
    cleanUpAndExit()
  }, true)

  const tipRack: CalibrationLabware | null =
    (labware && labware.find(l => l.isTiprack)) ?? null
  const calBlock: CalibrationLabware | null = labware
    ? labware.find(l => !l.isTiprack) ?? null
    : null

  const isMulti = React.useMemo(() => {
    const spec = instrument && getPipetteModelSpecs(instrument.model)
    return spec ? spec.channels > 1 : false
  }, [instrument])

  function sendCommands(...commands: SessionCommandParams[]): void {
    if (session?.id && !isJogging) {
      const sessionCommandActions = commands.map(c =>
        Sessions.createSessionCommand(robotName, session.id, {
          command: c.command,
          data: c.data ?? {},
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

  if (!session || !tipRack) {
    return null
  }
  const shouldPerformTipLength = session.details.shouldPerformTipLength
  const titleBarProps = {
    title: shouldPerformTipLength
      ? TIP_LENGTH_CALIBRATION_SUBTITLE
      : PIPETTE_OFFSET_CALIBRATION_SUBTITLE,
    back: { onClick: confirmExit, title: EXIT, children: EXIT },
  }

  if (showSpinner) {
    return <SpinnerModalPage key={instrument?.mount} titleBar={titleBarProps} />
  }

  // @ts-expect-error TODO protect against currentStep === undefined
  const Panel = PANEL_BY_STEP[currentStep]
  if (Panel == null) return null
  return (
    <Portal level="top">
      <ModalShell
        width="47rem"
        header={
          <WizardHeader
            title={
              shouldPerformTipLength
                ? TIP_LENGTH_CALIBRATION_SUBTITLE
                : PIPETTE_OFFSET_CALIBRATION_SUBTITLE
            }
            currentStep={1}
            totalSteps={5}
            onExit={confirmExit}
          />
        }
      >
        <Panel
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          tipRack={tipRack}
          isMulti={isMulti}
          mount={instrument?.mount.toLowerCase() as Mount}
          calBlock={calBlock}
          currentStep={currentStep}
          sessionType={session.sessionType}
          shouldPerformTipLength={shouldPerformTipLength}
          intent={intent}
          robotName={robotName}
          supportedCommands={supportedCommands}
          defaultTipracks={instrument?.defaultTipracks}
        />
      </ModalShell>
      {showConfirmExit && (
        <ConfirmExitModal
          exit={confirmExit}
          back={cancelExit}
          sessionType={session.sessionType}
        />
      )}
    </Portal>
  )
}
