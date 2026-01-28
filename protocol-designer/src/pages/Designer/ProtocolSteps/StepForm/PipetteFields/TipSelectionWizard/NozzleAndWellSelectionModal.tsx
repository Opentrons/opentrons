import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  Box,
  ModalShell,
  PrimaryButton,
  SPACING,
  WizardHeader,
} from '@opentrons/components'

import { getMainPagePortalEl } from '/protocol-designer/components/organisms'
import { getRobotType } from '/protocol-designer/file-data/selectors'

import { PipetteNozzleSelector } from './PipetteShadows/PipetteNozzleSelector'
import { WellSelection } from './PipetteShadows/WellSelector'
import styles from './tipselectionwizard.module.css'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { DropdownOption } from '@opentrons/components'
import type { PipetteV2Specs } from '@opentrons/shared-data'
import type { FieldPropsByName } from '../../types'

interface NozzleAndWellSelectionModalProps {
  showModal: Dispatch<SetStateAction<boolean>>
  children?: ReactNode
  totalSteps: number
  pipetteSpecs: PipetteV2Specs
  options: DropdownOption[]
  updateValue: (arg: unknown) => void
  deckSetup: any
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
    options,
    updateValue,
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
  const handleClose = (): void => {
    showModal(false)
  }
  let currentComponent: JSX.Element
  switch (currentStepIndex) {
    case 0:
      currentComponent = (
        <PipetteNozzleSelector
          pipetteSpecs={pipetteSpecs}
          options={options}
          updateValue={updateValue}
          robotType={robotType}
        />
      )
      break

    case 1:
      currentComponent = (
        <WellSelection
          propsForFields={propsForFields}
          deckSetup={deckSetup}
          stepType={isMixStep ? stepType : 'aspirate'}
          robotType={robotType}
        />
      )
      break

    case 2:
      currentComponent = (
        <WellSelection
          propsForFields={propsForFields}
          deckSetup={deckSetup}
          stepType={'dispense'}
          robotType={robotType}
        />
      )
      break
    default:
      console.warn(`no current component for step index ${currentStepIndex}`)
      currentComponent = <></>
  }

  const header = (
    <WizardHeader
      title={t('select_nozzles_and_wells')}
      currentStep={currentStepIndex + 1}
      totalSteps={totalSteps}
      onExit={handleClose}
    />
  )

  const footerElement = (
    <div className={styles.modal_footer}>
      <PrimaryButton onClick={handleContinue}>{'Continue'}</PrimaryButton>
    </div>
  )

  return createPortal(
    <ModalShell header={header} width="56.25rem" footer={footerElement}>
      <Box padding={SPACING.spacing24}>{children}</Box>
      {currentComponent}
    </ModalShell>,
    getMainPagePortalEl()
  )
}
