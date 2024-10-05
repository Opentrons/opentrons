import type * as React from 'react'
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
`
const HEADER_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_ROW};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing16} ${SPACING.spacing32};
`
const TEXT_STYLE = css`
  ${TYPOGRAPHY.pSemiBold}
`

export const WizardHeader = (props: WizardHeaderProps): JSX.Element => {
  const { totalSteps, currentStep, title, onExit, exitDisabled } = props
  return (
    <Box backgroundColor={COLORS.white}>
      <Flex css={HEADER_CONTAINER_STYLE}>
        <Flex flexDirection={DIRECTION_ROW}>
          <Text css={TEXT_STYLE} marginRight={SPACING.spacing8}>
            {title}
          </Text>

          {currentStep != null && totalSteps != null && currentStep > 0 ? (
            <Text css={TEXT_STYLE} color={COLORS.grey50}>
              {`Steps: ${currentStep}/${totalSteps}`}
            </Text>
          ) : null}
        </Flex>
        {onExit != null ? (
          <Btn onClick={onExit} aria-label="Exit" disabled={exitDisabled}>
            <Text css={EXIT_BUTTON_STYLE}>Exit</Text>
          </Btn>
        ) : null}
      </Flex>
      <StepMeter totalSteps={totalSteps ?? 0} currentStep={currentStep ?? 0} />
    </Box>
  )
}
