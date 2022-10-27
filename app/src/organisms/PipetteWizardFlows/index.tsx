import * as React from 'react'
import { useTranslation } from 'react-i18next'
// import { useSelector } from 'react-redux'
// import { getAttachedPipettes } from '../../redux/pipettes'
import { ModalShell } from '../../molecules/Modal'
import { Portal } from '../../App/portal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { getPipetteWizardSteps } from './getPipetteWizardSteps'
import { FLOWS, SECTIONS } from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { AttachStem } from './AttachStem'
import { DetachStem } from './DetachStem'
import { Results } from './Results'

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

  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (currentStep.section === SECTIONS.BEFORE_BEGINNING) {
    modalContent = <BeforeBeginning {...calibrateBaseProps} proceed={proceed} />
  } else if (currentStep.section === SECTIONS.ATTACH_STEM) {
    modalContent = <AttachStem {...calibrateBaseProps} proceed={proceed} />
  } else if (currentStep.section === SECTIONS.DETACH_STEM) {
    modalContent = <DetachStem {...calibrateBaseProps} proceed={proceed} />
  } else if (currentStep.section === SECTIONS.RESULTS) {
    modalContent = <Results {...calibrateBaseProps} proceed={closeFlow} />
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
            onExit={closeFlow}
          />
        }
      >
        {modalContent}
      </ModalShell>
    </Portal>
  )
}
