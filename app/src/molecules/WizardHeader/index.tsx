import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  Btn,
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StepMeter } from '../../atoms/StepMeter'

interface WizardHeaderProps {
  title: string
  onExit?: (() => void) | null
  totalSteps?: number | null
  currentStep?: number | null
  exitDisabled?: boolean
}

const EXIT_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  color: ${COLORS.grey60};

  &:hover {
    color: ${COLORS.grey50};
  }
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    margin-right: 1.75rem;
    font-size: ${TYPOGRAPHY.fontSize22};
    font-weight: ${TYPOGRAPHY.fontWeightBold};
    &:hover {
      opacity: 100%;
    }
    &:active {
      color: ${COLORS.grey50};
    }
  }
`
const BOX_STYLE = css`
  background-color: ${COLORS.white};
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    border-radius: ${BORDERS.borderRadius16};
  }
`
const HEADER_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_ROW};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing16} ${SPACING.spacing32};
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    padding: 1.75rem ${SPACING.spacing32};
    border-radius: ${BORDERS.borderRadius16};
  }
`
const HEADER_TEXT_STYLE = css`
  ${TYPOGRAPHY.pSemiBold}
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    font-size: ${TYPOGRAPHY.fontSize22};
    font-weight: ${TYPOGRAPHY.fontWeightBold};
    line-height: ${TYPOGRAPHY.lineHeight28};
  }
`
const STEP_TEXT_STYLE = css`
  ${TYPOGRAPHY.pSemiBold}
  color: ${COLORS.grey60};
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
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
          <LegacyStyledText
            css={HEADER_TEXT_STYLE}
            marginRight={SPACING.spacing8}
          >
            {title}
          </LegacyStyledText>

          {currentStep != null && totalSteps != null && currentStep > 0 ? (
            <LegacyStyledText css={STEP_TEXT_STYLE}>
              {t('step', { current: currentStep, max: totalSteps })}
            </LegacyStyledText>
          ) : null}
        </Flex>
        {onExit != null ? (
          <Btn onClick={onExit} aria-label="Exit" disabled={exitDisabled}>
            <LegacyStyledText css={EXIT_BUTTON_STYLE}>
              {t('exit')}
            </LegacyStyledText>
          </Btn>
        ) : null}
      </Flex>
      <StepMeter totalSteps={totalSteps ?? 0} currentStep={currentStep ?? 0} />
    </Box>
  )
}
