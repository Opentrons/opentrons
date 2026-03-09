import {
  Box,
  Btn,
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StepMeter,
  Text,
} from '@opentrons/components'

import styles from './wizardheader.module.css'

import type * as React from 'react'

interface WizardHeaderProps {
  title: string
  onExit?: React.MouseEventHandler | null
  totalSteps?: number
  currentStep?: number | null
  exitDisabled?: boolean
}

export const WizardHeader = (props: WizardHeaderProps): JSX.Element => {
  const { totalSteps, currentStep, title, onExit, exitDisabled } = props
  return (
    <Box backgroundColor={COLORS.white}>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        padding={`${SPACING.spacing16} ${SPACING.spacing32}`}
      >
        <Flex flexDirection={DIRECTION_ROW}>
          <Text className={styles.text} marginRight={SPACING.spacing8}>
            {title}
          </Text>

          {currentStep != null && totalSteps != null && currentStep > 0 ? (
            <Text className={styles.text} color={COLORS.grey50}>
              {`Steps: ${currentStep}/${totalSteps}`}
            </Text>
          ) : null}
        </Flex>
        {onExit != null ? (
          <Btn onClick={onExit} aria-label="Exit" disabled={exitDisabled}>
            <Text className={styles.exit_button}>Exit</Text>
          </Btn>
        ) : null}
      </Flex>
      <StepMeter totalSteps={totalSteps ?? 0} currentStep={currentStep ?? 0} />
    </Box>
  )
}
