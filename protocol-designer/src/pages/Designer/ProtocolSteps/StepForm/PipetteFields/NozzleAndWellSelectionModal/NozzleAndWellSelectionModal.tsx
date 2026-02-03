import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { ModalShell, PrimaryButton, WizardHeader } from '@opentrons/components'

import { getMainPagePortalEl } from '/protocol-designer/components/organisms'
import { getRobotType } from '/protocol-designer/file-data/selectors'

import styles from './nozzleandwellwizard.module.css'
import { PipetteNozzleSelector } from './PipetteNozzleSelector'
import { WellSelector } from './WellSelector'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { DropdownOption } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'
import type { FieldPropsByName } from '../../types'

interface NozzleAndWellSelectionModalProps {
  showModal: Dispatch<SetStateAction<boolean>>
  children?: ReactNode
  totalSteps: number
  pipetteSpecs: PipetteV2Specs
  options: DropdownOption[]
  updateValue: (arg: unknown) => void
  deckSetup: AllTemporalPropertiesForTimelineFrame
  propsForFields: FieldPropsByName
  stepType: string
  value: NozzleConfigurationStyle
  setSelectedValue: any
}

export function NozzleAndWellSelectionModal(
  props: NozzleAndWellSelectionModalProps
): JSX.Element {
  const {
    children,
    totalSteps,
    pipetteSpecs,
    options,
    deckSetup,
    showModal,
    propsForFields,
    stepType,
    updateValue,
    setSelectedValue,
    value,
  } = props
  const { t } = useTranslation('protocol_steps')
  const robotType = useSelector(getRobotType)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const isMixStep = stepType === 'mix'
  const handleContinue = (): void => {
    setCurrentStepIndex(currentStepIndex => currentStepIndex + 1)
  }
  const handleClose = (): void => {
    showModal(false)
  }
  const getStepComponent = (): JSX.Element => {
    switch (currentStepIndex) {
      case 0:
        return (
          <PipetteNozzleSelector
            pipetteSpecs={pipetteSpecs}
            options={options}
            robotType={robotType}
            updateValue={updateValue}
            value={value}
            setSelectedValue={setSelectedValue}
          />
        )

      case 1:
        return (
          <WellSelector
            propsForFields={propsForFields}
            deckSetup={deckSetup}
            stepType={isMixStep ? stepType : 'aspirate'}
            robotType={robotType}
            nozzleConfiguration={value}
          />
        )

      case 2:
        return (
          <WellSelector
            propsForFields={propsForFields}
            deckSetup={deckSetup}
            stepType={'dispense'}
            robotType={robotType}
            nozzleConfiguration={value}
          />
        )

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
