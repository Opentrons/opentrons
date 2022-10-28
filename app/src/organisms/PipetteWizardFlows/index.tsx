import * as React from 'react'
import { useTranslation } from 'react-i18next'
// import { useSelector } from 'react-redux'
// import { getAttachedPipettes } from '../../redux/pipettes'
import { useConditionalConfirm } from '@opentrons/components'
import { ModalShell } from '../../molecules/Modal'
import { Portal } from '../../App/portal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { getPipetteWizardSteps } from './getPipetteWizardSteps'
import { FLOWS, SECTIONS } from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { AttachStem } from './AttachStem'
import { DetachStem } from './DetachStem'
import { InProgress } from './InProgress'
import { Results } from './Results'
import { ExitModal } from './ExitModal'

// import type { State } from '../../redux/types'
import type { PipetteWizardFlow } from './types'
import type { PipetteMount } from '@opentrons/shared-data'

interface PipetteWizardFlowsProps {
  flowType: PipetteWizardFlow
  mount: PipetteMount
  robotName: string
  closeFlow: () => void
}
export const PipetteWizardFlows = (
  props: PipetteWizardFlowsProps
): JSX.Element | null => {
  const { flowType, mount, closeFlow } = props
  const { t } = useTranslation('pipette_wizard_flows')
  //   const attachedPipette = useSelector(
  //     (state: State) => getAttachedPipettes(state, robotName)[mount]
  //   )
  const pipetteWizardSteps = getPipetteWizardSteps(flowType)

  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)

  const totalStepCount = pipetteWizardSteps.length - 1
  const currentStep = pipetteWizardSteps?.[currentStepIndex]

  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(closeFlow, true)

  if (currentStep == null) return null
  const proceed = (): void => {
    setCurrentStepIndex(
      currentStepIndex !== pipetteWizardSteps.length - 1
        ? currentStepIndex + 1
        : currentStepIndex
    )
  }
  const goBack = (): void => {
    setCurrentStepIndex(
      currentStepIndex !== pipetteWizardSteps.length - 1
        ? currentStepIndex - 1
        : currentStepIndex
    )
  }
  const calibrateBaseProps = {
    mount,
    flowType: FLOWS.CALIBRATE,
    goBack,
  }
  const movement = false // TODO(jr, 10/27/22): wire this up!
  const exitModal = (
    <ExitModal
      goBack={cancelExit}
      proceed={closeFlow}
      flowType={flowType}
      mount={mount}
    />
  )
  let onExit
  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (movement) {
    modalContent = <InProgress />
  } else if (currentStep.section === SECTIONS.BEFORE_BEGINNING) {
    onExit = closeFlow
    modalContent = <BeforeBeginning {...calibrateBaseProps} proceed={proceed} />
  } else if (currentStep.section === SECTIONS.ATTACH_STEM) {
    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <AttachStem {...calibrateBaseProps} proceed={proceed} />
    )
  } else if (currentStep.section === SECTIONS.DETACH_STEM) {
    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <DetachStem {...calibrateBaseProps} proceed={proceed} />
    )
  } else if (currentStep.section === SECTIONS.RESULTS) {
    onExit = confirmExit
    modalContent = showConfirmExit ? (
      exitModal
    ) : (
      <Results {...calibrateBaseProps} proceed={closeFlow} />
    )
  }

  let wizardTitle: string = 'unknown page'
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      wizardTitle = t('calibrate_pipette')
      break
    }
  }
  return (
    <Portal level="top">
      <ModalShell
        width="47rem"
        header={
          <WizardHeader
            title={wizardTitle}
            currentStep={currentStepIndex}
            totalSteps={totalStepCount}
            onExit={onExit}
          />
        }
      >
        {modalContent}
      </ModalShell>
    </Portal>
  )
}
