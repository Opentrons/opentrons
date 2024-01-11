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
  LEGACY_COLORS,
  SPACING,
  RESPONSIVENESS,
  BORDERS,
  ALIGN_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { StepMeter } from '../../atoms/StepMeter'

interface WizardHeaderProps {
  title: string
  onExit?: (() => void) | null
  totalSteps?: number
  currentStep?: number | null
  exitDisabled?: boolean
}

const EXIT_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  color: ${LEGACY_COLORS.darkGreyEnabled};

  &:hover {
    opacity: 70%;
  }
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    margin-right: 1.75rem;
    font-size: ${TYPOGRAPHY.fontSize22};
    font-weight: ${TYPOGRAPHY.fontWeightBold};
    &:hover {
      opacity: 100%;
    }
    &:active {
      opacity: 70%;
    }
  }
`
const BOX_STYLE = css`
  background-color: ${LEGACY_COLORS.white} @media
    ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    border-radius: ${BORDERS.borderRadiusSize4};
  }
`
const HEADER_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_ROW};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing16} ${SPACING.spacing32};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    padding: 1.75rem ${SPACING.spacing32};
    border-radius: ${BORDERS.borderRadiusSize4};
  }
`
const HEADER_TEXT_STYLE = css`
  ${TYPOGRAPHY.pSemiBold}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize22};
    font-weight: ${TYPOGRAPHY.fontWeightBold};
    line-height: ${TYPOGRAPHY.lineHeight28};
  }
`
const STEP_TEXT_STYLE = css`
  ${TYPOGRAPHY.pSemiBold}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.375rem;
    margin-left: ${SPACING.spacing16};
  }
`

export const WizardHeader = (props: WizardHeaderProps): JSX.Element => {
  const { totalSteps, currentStep, title, onExit, exitDisabled } = props
  const { t } = useTranslation('shared')

  return (
    <Box css={BOX_STYLE}>
      <Flex css={HEADER_CONTAINER_STYLE}>
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <StyledText css={HEADER_TEXT_STYLE} marginRight={SPACING.spacing8}>
            {title}
          </StyledText>

          {currentStep != null && totalSteps != null && currentStep > 0 ? (
            <StyledText css={STEP_TEXT_STYLE} color={LEGACY_COLORS.darkGreyEnabled}>
              {t('step', { current: currentStep, max: totalSteps })}
            </StyledText>
          ) : null}
        </Flex>
        {onExit != null ? (
          <Btn onClick={onExit} aria-label="Exit" disabled={exitDisabled}>
            <StyledText css={EXIT_BUTTON_STYLE}>{t('exit')}</StyledText>
          </Btn>
        ) : null}
      </Flex>
      <StepMeter totalSteps={totalSteps ?? 0} currentStep={currentStep ?? 0} />
    </Box>
  )
}
