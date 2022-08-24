import * as React from 'react'
import { WizardHeader } from '../WizardHeader'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
} from '@opentrons/components'

interface Props {
  wizardHeaderTitle: string
  currentStep: number
  totalSteps: number
  children?: JSX.Element
}

export function InProgressModal(props: Props): JSX.Element {
  const { wizardHeaderTitle, totalSteps, currentStep, children } = props

  return (
    <>
      <WizardHeader
        totalSteps={totalSteps}
        currentStep={currentStep}
        title={wizardHeaderTitle}
      />
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        height="100%"
        transform="translateY(50%)"
      >
        <Icon
          name="ot-spinner"
          size="5.1rem"
          color={COLORS.darkGreyEnabled}
          aria-label="spinner"
          spin
        />
        {children}
      </Flex>
    </>
  )
}
