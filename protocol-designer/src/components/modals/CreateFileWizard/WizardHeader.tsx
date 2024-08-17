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
  RESPONSIVENESS,
  Text,
  StepMeter,
} from '@opentrons/components'

interface WizardHeaderProps {
  title: string
  onExit?: React.MouseEventHandler | null
  totalSteps?: number
  currentStep?: number | null
  exitDisabled?: boolean
}

const EXIT_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  color: ${COLORS.grey50};

  &:hover {
    opacity: 70%;
  }
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    margin-right: 1.75rem;
    font-size: ${TYPOGRAPHY.fontSize22};
    font-weight: ${TYPOGRAPHY.fontWeightBold};
  }
`
const HEADER_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_ROW};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing16} ${SPACING.spacing32};
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    padding: 1.75rem ${SPACING.spacing32};
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
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    font-size: 1.375rem;
    font-weight: 700;
    margin-left: ${SPACING.spacing16};
  }
`

export const WizardHeader = (props: WizardHeaderProps): JSX.Element => {
  const { totalSteps, currentStep, title, onExit, exitDisabled } = props
  const { t } = useTranslation('shared')
  return (
    <Box backgroundColor={COLORS.white}>
      <Flex css={HEADER_CONTAINER_STYLE}>
        <Flex flexDirection={DIRECTION_ROW}>
          <Text css={HEADER_TEXT_STYLE} marginRight={SPACING.spacing8}>
            {title}
          </Text>

          {currentStep != null && totalSteps != null && currentStep > 0 ? (
            <Text css={STEP_TEXT_STYLE} color={COLORS.grey50}>
              {t('step', { current: currentStep, max: totalSteps })}
            </Text>
          ) : null}
        </Flex>
        {onExit != null ? (
          <Btn onClick={onExit} aria-label="Exit" disabled={exitDisabled}>
            <Text css={EXIT_BUTTON_STYLE}>{t('exit')}</Text>
          </Btn>
        ) : null}
      </Flex>
      <StepMeter totalSteps={totalSteps ?? 0} currentStep={currentStep ?? 0} />
    </Box>
  )
}
