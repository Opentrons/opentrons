import * as React from 'react'
// import { useSelector } from 'react-redux'
// import { getAttachedPipettes } from '../../redux/pipettes'
import { ModalShell } from '../../molecules/Modal'
import { Portal } from '../../App/portal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { getPipetteWizardSteps } from './getPipetteWizardSteps'
import { SECTIONS } from './constants'

// import type { State } from '../../redux/types'
import type { PipetteWizardFlow } from './types'
import type { PipetteMount } from '@opentrons/shared-data'

export const PipetteWizardFlows = (
  flowType: PipetteWizardFlow,
  mount: PipetteMount,
  robotName: string
): JSX.Element | null => {
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

  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (currentStep.section === SECTIONS.BEFORE_BEGINNING) {
    modalContent = <div>BEFORE BEGINNING</div>
  } else if (currentStep.section === SECTIONS.ATTACH_STEM) {
    modalContent = <div>ATTACH STEM</div>
  } else if (currentStep.section === SECTIONS.DETACH_STEM) {
    modalContent = <div>DETACH STEM</div>
  } else if (currentStep.section === SECTIONS.RESULTS) {
    modalContent = <div>RESULTS</div>
  }

  return (
    <Portal level="top">
      <ModalShell
        width="47rem"
        header={
          <WizardHeader
            title="Calibrate Pipette Title"
            currentStep={currentStepIndex}
            totalSteps={totalStepCount}
          />
        }
      >
        {modalContent}
      </ModalShell>
    </Portal>
  )
}
