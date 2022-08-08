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
  BORDERS,
} from '@opentrons/components'
import { StyledText } from '../text'
import { StepMeter } from '../StepMeter'

interface WizardHeaderProps {
  totalSteps: number
  currentStep: number | null
  title: string
  body: JSX.Element
  onExit: () => void
  footer?: JSX.Element
}

export const WizardHeader = (props: WizardHeaderProps): JSX.Element => {
  const { totalSteps, currentStep, title, body, onExit, footer } = props
  const { t } = useTranslation('shared')

  return (
    <Box
      backgroundColor={COLORS.white}
      boxShadow={BORDERS.smallDropShadow}
      borderRadius="0px 0px 4px 4px"
    >
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

        <Btn onClick={onExit}>
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
      <Box
        paddingTop={SPACING.spacing6}
        paddingX={SPACING.spacing6}
        overflowY="scroll"
      >
        {body}
      </Box>
      {footer != null ? (
        <Box padding={`${SPACING.spacing5} ${SPACING.spacing6}`}>{footer}</Box>
      ) : null}
    </Box>
  )
}
