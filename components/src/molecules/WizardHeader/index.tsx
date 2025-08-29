import { LegacyStyledText, StepMeter, StyledText } from '../../atoms'
import { Box, Btn, Flex } from '../../primitives'
import {
  ALIGN_CENTER,
  DIRECTION_ROW,
} from '../../styles'
import { SPACING } from '../../ui-style-constants'

import styles from './wizardheader.module.css'

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



export const WizardHeader = (props: WizardHeaderProps): JSX.Element => {
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
            <LegacyStyledText className={styles.step_text}>
              {`Step ${currentStep} / ${totalSteps}`}
            </LegacyStyledText>
          ) : null}
        </Flex>
        {onExit != null ? (
          <Btn onClick={onExit} aria-label="Exit" disabled={exitDisabled}>
            <LegacyStyledText className={styles.exit_button}>
              {exitButtonCopy ?? 'Exit'}
            </LegacyStyledText>
          </Btn>
        ) : null}
      </Flex>
      <StepMeter totalSteps={totalSteps ?? 0} currentStep={currentStep ?? 0} />
    </Box>
  )
}
