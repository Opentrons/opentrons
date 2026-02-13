import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ModalShell,
  PrimaryButton,
  SecondaryButton,
  WizardHeader,
} from '@opentrons/components'

import { getMainPagePortalEl } from '/protocol-designer/components/organisms'
import { getRobotType } from '/protocol-designer/file-data/selectors'

import styles from './nozzleandwellwizard.module.css'
import { PipetteNozzleSelector } from './PipetteNozzleSelector'
import { WellSelector } from './WellSelector'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { PipetteV2Specs } from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'
import type { FieldPropsByName } from '../../types'

interface NozzleAndWellSelectionModalProps {
  showModal: Dispatch<SetStateAction<boolean>>
  children?: ReactNode
  totalSteps: number
  pipetteSpecs: PipetteV2Specs
  deckSetup: AllTemporalPropertiesForTimelineFrame
  propsForFields: FieldPropsByName
  stepType: string
}

export function NozzleAndWellSelectionModal(
  props: NozzleAndWellSelectionModalProps
): JSX.Element {
  const {
    children,
    totalSteps,
    pipetteSpecs,
    deckSetup,
    showModal,
    propsForFields,
    stepType,
  } = props

  const { t } = useTranslation('protocol_steps')
  const robotType = useSelector(getRobotType)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const isMixStep = stepType === 'mix'
  const handleContinue = (): void => {
    setCurrentStepIndex(currentStepIndex => currentStepIndex + 1)
  }
  const handleBack = (): void => {
    setCurrentStepIndex(currentStepIndex => currentStepIndex - 1)
  }
  const handleClose = (): void => {
    showModal(false)
  }
  const nozzleAndWellSelectionBaseModalProps = {
    robotType,
    propsForFields,
  }
  const wellSelectorBaseProps = {
    ...nozzleAndWellSelectionBaseModalProps,
    deckSetup,
    pipetteSpecs,
  }
  function getStepComponent(): JSX.Element {
    switch (currentStepIndex) {
      case 0:
        return (
          <PipetteNozzleSelector
            {...nozzleAndWellSelectionBaseModalProps}
            pipetteSpecs={pipetteSpecs}
          />
        )

      case 1:
        return (
          <WellSelector
            {...wellSelectorBaseProps}
            stepType={isMixStep ? stepType : 'aspirate'}
          />
        )

      case 2:
        return <WellSelector {...wellSelectorBaseProps} stepType="dispense" />

      default:
        console.warn(`no current component for step index ${currentStepIndex}`)
        return <></>
    }
  }
  const currentComponent = getStepComponent()
  const header = (
    <WizardHeader
      title={t('select_nozzles_and_wells')}
      currentStep={currentStepIndex + 1}
      totalSteps={totalSteps}
      onExit={handleClose}
    />
  )
  const isLastStep = currentStepIndex + 1 === totalSteps
  const isLastStepOfMix = isMixStep
    ? currentStepIndex + 1 === totalSteps - 1
    : false
  const footerElement = (
    <div className={styles.modal_footer}>
      {currentStepIndex !== 0 ? (
        <SecondaryButton onClick={handleBack}>
          {t('shared:go_back')}
        </SecondaryButton>
      ) : null}

      <PrimaryButton
        onClick={isLastStep || isLastStepOfMix ? handleClose : handleContinue}
      >
        {'Continue'}
      </PrimaryButton>
    </div>
  )

  return createPortal(
    <ModalShell header={header} width="56.25rem" footer={footerElement}>
      <div>{children}</div>
      {currentComponent}
    </ModalShell>,
    getMainPagePortalEl()
  )
}
