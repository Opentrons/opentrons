import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { WizardHeader } from '../../molecules/WizardHeader'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
} from '@opentrons/components'

interface Props {
  title: string
  currentStep: number
  totalSteps: number
}

export function InProgressModal(props: Props): JSX.Element {
  const { title, totalSteps, currentStep } = props
  const { t } = useTranslation('change_pipette')

  return (
    <>
      <WizardHeader
        totalSteps={totalSteps}
        currentStep={currentStep}
        title={title}
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
        <StyledText
          as="h1"
          marginTop={SPACING.spacing5}
          marginBottom={SPACING.spacing3}
        >
          {t('moving_gantry')}
        </StyledText>
      </Flex>
    </>
  )
}
