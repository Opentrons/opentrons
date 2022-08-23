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
  ConfirmExitModal,
  MeasureNozzle,
  MeasureTip,
} from '../../organisms/DeprecatedCalibrationPanels'
import { Introduction, DeckSetup } from '../../organisms/CalibrationPanels'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { Portal } from '../../App/portal'
import { ReturnTip } from './ReturnTip'
import { ResultsSummary } from './ResultsSummary'

import type { Mount } from '@opentrons/components'
import type {
  CalibrationLabware,
  RobotCalibrationCheckStep,
  SessionCommandParams,
} from '../../redux/sessions/types'

import type { CalibrationPanelProps } from '../../organisms/DeprecatedCalibrationPanels/types'
import type { CalibrationCheckParentProps } from './types'

import styles from './styles.css'

const ROBOT_CALIBRATION_CHECK_SUBTITLE = 'Calibration health check'
const EXIT = 'exit'

const PANEL_BY_STEP: {
  [step in RobotCalibrationCheckStep]?: React.ComponentType<CalibrationPanelProps>
} = {
  [Sessions.CHECK_STEP_SESSION_STARTED]: Introduction,
  [Sessions.CHECK_STEP_LABWARE_LOADED]: DeckSetup,
  [Sessions.CHECK_STEP_COMPARING_NOZZLE]: MeasureNozzle,
  [Sessions.CHECK_STEP_PREPARING_PIPETTE]: TipPickUp,
  [Sessions.CHECK_STEP_INSPECTING_TIP]: TipConfirmation,
  [Sessions.CHECK_STEP_COMPARING_TIP]: MeasureTip,
  [Sessions.CHECK_STEP_COMPARING_HEIGHT]: SaveZPoint,
  [Sessions.CHECK_STEP_COMPARING_POINT_ONE]: SaveXYPoint,
  [Sessions.CHECK_STEP_COMPARING_POINT_TWO]: SaveXYPoint,
  [Sessions.CHECK_STEP_COMPARING_POINT_THREE]: SaveXYPoint,
  [Sessions.CHECK_STEP_RETURNING_TIP]: ReturnTip,
  [Sessions.CHECK_STEP_RESULTS_SUMMARY]: ResultsSummary,
}

export function CheckCalibration(
  props: CalibrationCheckParentProps
): JSX.Element | null {
  const { session, robotName, dispatchRequests, showSpinner, isJogging } = props
  const {
    currentStep,
    activePipette,
    activeTipRack,
    instruments,
    comparisonsByPipette,
    labware,
  } = session?.details || {}

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {
    cleanUpAndExit()
  }, true)

  const isMulti = React.useMemo(() => {
    const spec = activePipette && getPipetteModelSpecs(activePipette.model)
    return spec ? spec.channels > 1 : false
  }, [activePipette])

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

  const checkBothPipettes = instruments?.length === 2

  if (!session || !activeTipRack) {
    return null
  }

  const titleBarProps = {
    title: ROBOT_CALIBRATION_CHECK_SUBTITLE,
    back: {
      onClick: confirmExit,
      title: EXIT,
      children: EXIT,
      ...(currentStep === Sessions.CHECK_STEP_RESULTS_SUMMARY
        ? { className: styles.suppress_exit_button }
        : {}),
    },
  }

  if (showSpinner) {
    return <SpinnerModalPage titleBar={titleBarProps} />
  }

  const Panel = currentStep in PANEL_BY_STEP ? PANEL_BY_STEP[currentStep] : null
  if (Panel == null) return null
  return (
    <Portal level="top">
      <ModalShell
        width="47rem"
        header={
          <WizardHeader
            title={ROBOT_CALIBRATION_CHECK_SUBTITLE}
            currentStep={1}
            totalSteps={5}
            onExit={confirmExit}
          />
        }
      >
        <Panel
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          tipRack={activeTipRack}
          calBlock={calBlock}
          isMulti={isMulti}
          mount={activePipette?.mount.toLowerCase() as Mount}
          currentStep={currentStep}
          sessionType={session.sessionType}
          checkBothPipettes={checkBothPipettes}
          instruments={instruments}
          comparisonsByPipette={comparisonsByPipette}
          activePipette={activePipette}
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
