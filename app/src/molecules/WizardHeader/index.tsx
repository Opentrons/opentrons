import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Btn,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  COLORS,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { StepMeter } from '../../atoms/StepMeter'

interface WizardHeaderProps {
  totalSteps: number
  currentStep: number | null
  title: string
  onExit: () => void
}

export const WizardHeader = (props: WizardHeaderProps): JSX.Element => {
  const { totalSteps, currentStep, title, onExit } = props
  const { t } = useTranslation('shared')

  return (
    <Box backgroundColor={COLORS.white}>
      <Flex
        padding={`${SPACING.spacing4} ${SPACING.spacing6}`}
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection={DIRECTION_ROW}>
          <StyledText css={TYPOGRAPHY.pSemiBold} marginRight={SPACING.spacing3}>
            {title}
          </StyledText>
          {currentStep != null && currentStep > 0 ? (
            <StyledText
              css={TYPOGRAPHY.pSemiBold}
              color={COLORS.darkGreyEnabled}
            >
              {t('step', { current: currentStep, max: totalSteps })}
            </StyledText>
          ) : null}
        </Flex>

        <Btn onClick={onExit} aria-label="Exit">
          <StyledText
            css={TYPOGRAPHY.pSemiBold}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            color={COLORS.darkGreyEnabled}
          >
            {t('exit')}
          </StyledText>
        </Btn>
      </Flex>

      <StepMeter totalSteps={totalSteps} currentStep={currentStep} />
    </Box>
  )
}
