import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
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
  isErrorState?: boolean
  onExit?: () => void
}

const EXIT_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  color: ${COLORS.darkGreyEnabled};

  &:hover {
    opacity: 70%;
  }
`
export const WizardHeader = (props: WizardHeaderProps): JSX.Element => {
  const { totalSteps, currentStep, title, isErrorState, onExit } = props
  const { t } = useTranslation('shared')

  let stepCounter: JSX.Element | null = null
  if (isErrorState) {
    stepCounter = null
  } else if (currentStep != null && currentStep > 0) {
    stepCounter = (
      <StyledText css={TYPOGRAPHY.pSemiBold} color={COLORS.darkGreyEnabled}>
        {t('step', { current: currentStep, max: totalSteps })}
      </StyledText>
    )
  }

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
          {stepCounter}
        </Flex>
        {onExit != null ? (
          <Btn onClick={onExit} aria-label="Exit">
            <StyledText css={EXIT_BUTTON_STYLE}>{t('exit')}</StyledText>
          </Btn>
        ) : null}
      </Flex>
      <StepMeter totalSteps={totalSteps} currentStep={currentStep} />
    </Box>
  )
}
