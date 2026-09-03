import { StepMeter, StyledText } from '../../atoms'
import { grey60 } from '../../helix-design-system/colors'
import { Box, Btn, Flex } from '../../primitives'
import { ALIGN_CENTER, DIRECTION_ROW } from '../../styles'
import { SPACING } from '../../ui-style-constants'
import styles from './wizardheader.module.css'

import type { ReactNode } from 'react'

interface WizardHeaderProps {
  title: string
  onExit?: (() => void) | null
  /* Optional copy override for the exit button. */
  exitButtonCopy?: string
  totalSteps?: number | null
  currentStep?: number | null
  exitDisabled?: boolean
  hideStepText?: boolean
}

export const WizardHeader = (props: WizardHeaderProps): ReactNode => {
  const {
    totalSteps,
    currentStep,
    hideStepText,
    title,
    onExit,
    exitDisabled,
    exitButtonCopy,
  } = props

  return (
    <Box className={styles.box}>
      <Flex className={styles.header_container}>
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          gap={SPACING.spacing8}
        >
          <StyledText
            desktopStyle="bodyLargeSemiBold"
            oddStyle="bodyTextSemiBold"
          >
            {title}
          </StyledText>

          {hideStepText !== true &&
          currentStep != null &&
          totalSteps != null &&
          currentStep > 0 ? (
            <StyledText
              desktopStyle="bodyDefaultRegular"
              oddStyle="bodyTextSemiBold"
              color={grey60}
            >
              {`Step ${currentStep} / ${totalSteps}`}
            </StyledText>
          ) : null}
        </Flex>
        {onExit != null ? (
          <Btn
            onClick={onExit}
            aria-label="Exit"
            disabled={exitDisabled}
            className={styles.exit_button}
          >
            <StyledText
              desktopStyle="bodyDefaultSemiBold"
              oddStyle="bodyTextSemiBold"
            >
              {exitButtonCopy ?? 'Exit'}
            </StyledText>
          </Btn>
        ) : null}
      </Flex>
      <StepMeter totalSteps={totalSteps ?? 0} currentStep={currentStep ?? 0} />
    </Box>
  )
}
