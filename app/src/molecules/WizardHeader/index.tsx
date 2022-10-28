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
  title: string
  onExit?: (() => void) | null
  totalSteps?: number
  currentStep?: number | null
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
          {currentStep != null && totalSteps != null && currentStep > 0 ? (
            <StyledText
              css={TYPOGRAPHY.pSemiBold}
              color={COLORS.darkGreyEnabled}
            >
              {t('step', { current: currentStep, max: totalSteps })}
            </StyledText>
          ) : null}
        </Flex>
        {onExit != null ? (
          <Btn onClick={onExit} aria-label="Exit">
            <StyledText css={EXIT_BUTTON_STYLE}>{t('exit')}</StyledText>
          </Btn>
        ) : null}
      </Flex>
      <StepMeter totalSteps={totalSteps ?? 0} currentStep={currentStep ?? 0} />
    </Box>
  )
}
