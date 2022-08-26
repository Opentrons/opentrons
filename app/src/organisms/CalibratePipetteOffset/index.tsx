// Pipette Offset Calibration Orchestration Component
import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { useConditionalConfirm } from '@opentrons/components'

import * as Sessions from '../../redux/sessions'
import { CompleteConfirmation } from '../../organisms/DeprecatedCalibrationPanels'
import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
  SaveZPoint,
  SaveXYPoint,
  MeasureNozzle,
  MeasureTip,
  ConfirmExit,
  LoadingState,
} from '../../organisms/CalibrationPanels'
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
  const { t } = useTranslation('robot_calibration')
  const {
    session,
    robotName,
    dispatchRequests,
    showSpinner,
    isJogging,
    intent,
  } = props
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
  const shouldPerformTipLength = session.details.shouldPerformTipLength

  const Panel =
    currentStep != null && currentStep in PANEL_BY_STEP
      ? PANEL_BY_STEP[currentStep]
      : null
  return (
    <Portal level="top">
      <ModalShell
        width="47rem"
        header={
          <WizardHeader
            title={
              shouldPerformTipLength
                ? t('tip_length_calibration')
                : t('pipette_offset_calibration')
            }
            currentStep={1}
            totalSteps={5}
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
            shouldPerformTipLength={shouldPerformTipLength}
            intent={intent}
            robotName={robotName}
            supportedCommands={supportedCommands}
            defaultTipracks={instrument?.defaultTipracks}
          />
        )}
      </ModalShell>
    </Portal>
  )
}
