// Pipette Offset Calibration Orchestration Component
import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { useConditionalConfirm } from '@opentrons/components'

import * as Sessions from '../../redux/sessions'
import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
  SaveZPoint,
  SaveXYPoint,
  ConfirmExit,
  LoadingState,
  CompleteConfirmation,
} from '../../organisms/CalibrationPanels'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { Portal } from '../../App/portal'

import type { Mount } from '@opentrons/components'
import type {
  CalibrationLabware,
  CalibrationSessionStep,
  SessionCommandParams,
} from '../../redux/sessions/types'
import type { CalibratePipetteOffsetParentProps } from './types'
import type { CalibrationPanelProps } from '../../organisms/CalibrationPanels/types'

const PANEL_BY_STEP: Partial<
  Record<CalibrationSessionStep, React.ComponentType<CalibrationPanelProps>>
> = {
  [Sessions.PIP_OFFSET_STEP_SESSION_STARTED]: Introduction,
  [Sessions.PIP_OFFSET_STEP_LABWARE_LOADED]: DeckSetup,
  [Sessions.PIP_OFFSET_STEP_PREPARING_PIPETTE]: TipPickUp,
  [Sessions.PIP_OFFSET_STEP_INSPECTING_TIP]: TipConfirmation,
  [Sessions.PIP_OFFSET_STEP_JOGGING_TO_DECK]: SaveZPoint,
  [Sessions.PIP_OFFSET_STEP_SAVING_POINT_ONE]: SaveXYPoint,
  [Sessions.PIP_OFFSET_STEP_TIP_LENGTH_COMPLETE]: PipetteOffsetCalibrationComplete,
  [Sessions.PIP_OFFSET_STEP_CALIBRATION_COMPLETE]: PipetteOffsetCalibrationComplete,
}
const STEPS_IN_ORDER: CalibrationSessionStep[] = [
  Sessions.PIP_OFFSET_STEP_SESSION_STARTED,
  Sessions.PIP_OFFSET_STEP_LABWARE_LOADED,
  Sessions.PIP_OFFSET_STEP_PREPARING_PIPETTE,
  Sessions.PIP_OFFSET_STEP_INSPECTING_TIP,
  Sessions.PIP_OFFSET_STEP_JOGGING_TO_DECK,
  Sessions.PIP_OFFSET_STEP_SAVING_POINT_ONE,
  Sessions.PIP_OFFSET_STEP_CALIBRATION_COMPLETE,
]

export function CalibratePipetteOffset(
  props: CalibratePipetteOffsetParentProps
): JSX.Element | null {
  const { t } = useTranslation('robot_calibration')
  const { session, robotName, dispatchRequests, showSpinner, isJogging } = props
  const { currentStep, instrument, labware, supportedCommands } =
    session?.details ?? {}

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {
    cleanUpAndExit()
  }, true)

  const tipRack: CalibrationLabware | null =
    labware != null ? labware.find(l => l.isTiprack) ?? null : null
  const calBlock: CalibrationLabware | null =
    labware != null ? labware.find(l => !l.isTiprack) ?? null : null

  const isMulti = React.useMemo(() => {
    const spec =
      instrument != null ? getPipetteModelSpecs(instrument.model) : null
    return spec != null ? spec.channels > 1 : false
  }, [instrument])

  function sendCommands(...commands: SessionCommandParams[]): void {
    if (session?.id != null && !isJogging) {
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
    if (session?.id != null) {
      dispatchRequests(
        Sessions.createSessionCommand(robotName, session.id, {
          command: Sessions.sharedCalCommands.EXIT,
          data: {},
        }),
        Sessions.deleteSession(robotName, session.id)
      )
    }
  }

  if (session == null || tipRack == null) {
    return null
  }

  const Panel =
    currentStep != null && currentStep in PANEL_BY_STEP
      ? PANEL_BY_STEP[currentStep]
      : null
  return (
    <Portal level="top">
      <LegacyModalShell
        width="47rem"
        header={
          <WizardHeader
            title={t('pipette_offset_calibration')}
            currentStep={
              STEPS_IN_ORDER.findIndex(step => step === currentStep) ?? 0
            }
            totalSteps={STEPS_IN_ORDER.length - 1}
            onExit={confirmExit}
          />
        }
      >
        {showSpinner || currentStep == null || Panel == null ? (
          <LoadingState />
        ) : showConfirmExit ? (
          <ConfirmExit
            exit={confirmExit}
            back={cancelExit}
            heading={t('progress_will_be_lost', {
              sessionType: t('pipette_offset_calibration'),
            })}
            body={t('confirm_exit_before_completion', {
              sessionType: t('pipette_offset_calibration'),
            })}
          />
        ) : (
          <Panel
            sendCommands={sendCommands}
            cleanUpAndExit={cleanUpAndExit}
            tipRack={tipRack}
            isMulti={isMulti}
            mount={instrument?.mount.toLowerCase() as Mount}
            calBlock={calBlock}
            currentStep={currentStep}
            sessionType={session.sessionType}
            robotName={robotName}
            supportedCommands={supportedCommands}
            defaultTipracks={instrument?.defaultTipracks}
          />
        )}
      </LegacyModalShell>
    </Portal>
  )
}

function PipetteOffsetCalibrationComplete(
  props: CalibrationPanelProps
): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  const { cleanUpAndExit } = props

  return (
    <CompleteConfirmation
      {...{
        proceed: cleanUpAndExit,
        flowName: t('pipette_offset_calibration'),
      }}
    />
  )
}
