// Tip Length Calibration Orchestration Component
import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { useConditionalConfirm } from '@opentrons/components'

import * as Sessions from '../../redux/sessions'
import {
  CompleteConfirmation,
  INTENT_TIP_LENGTH_IN_PROTOCOL,
} from '../../organisms/DeprecatedCalibrationPanels'
import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
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
  SessionCommandParams,
  CalibrationLabware,
  CalibrationSessionStep,
} from '../../redux/sessions/types'
import type { CalibrationPanelProps } from '../../organisms/DeprecatedCalibrationPanels/types'
import type { CalibrateTipLengthParentProps } from './types'

export { AskForCalibrationBlockModal } from './AskForCalibrationBlockModal'
export { ConfirmRecalibrationModal } from './ConfirmRecalibrationModal'

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
  const { t } = useTranslation('robot_calibration')
  const { session, robotName, showSpinner, dispatchRequests, isJogging } = props
  const { currentStep, instrument, labware } = session?.details ?? {}

  const isMulti = React.useMemo(() => {
    const spec =
      instrument != null ? getPipetteModelSpecs(instrument.model) : null
    return spec != null ? spec.channels > 1 : false
  }, [instrument])

  const tipRack: CalibrationLabware | null =
    labware != null ? labware.find(l => l.isTiprack) ?? null : null
  const calBlock: CalibrationLabware | null =
    labware != null ? labware.find(l => !l.isTiprack) ?? null : null

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

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(() => {
    cleanUpAndExit()
  }, true)

  if (session == null || tipRack == null) {
    return null
  }

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
            title={t('tip_length_calibration')}
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
              sessionType: t('tip_length_calibration'),
            })}
            body={t('confirm_exit_before_completion', {
              sessionType: t('tip_length_calibration'),
            })}
          />
        ) : (
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
        )}
      </ModalShell>
    </Portal>
  )
}
