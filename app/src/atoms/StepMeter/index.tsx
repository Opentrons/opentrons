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
  POSITION_RELATIVE,
  BORDERS,
  POSITION_ABSOLUTE,
} from '@opentrons/components'
import { StyledText } from '../text'

interface StepMeterProps {
  totalSteps: number
  currentStep: number | null
  title: string
  body: JSX.Element
  exit: () => void
  showStepCount?: boolean
  footer?: JSX.Element
}

export const StepMeter = (props: StepMeterProps): JSX.Element => {
  const {
    totalSteps,
    currentStep,
    title,
    body,
    exit,
    showStepCount,
    footer,
  } = props
  const { t } = useTranslation('shared')
  const progress = currentStep || 0
  const percentComplete = `${(progress / totalSteps) * 100}%`

  const progressBarContainer = css`
    position: ${POSITION_RELATIVE};
    height: ${SPACING.spacing2};
    margin-bottom: ${SPACING.spacing4};
    background-color: #d9d9d9;
  `
  const progressBar = css`
    position: ${POSITION_ABSOLUTE};
    top: 0;
    height: 100%;
    background-color: ${COLORS.blue};
    width: ${percentComplete};
  `

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
          {showStepCount ? (
            <StyledText
              css={TYPOGRAPHY.pSemiBold}
              color={COLORS.darkGreyEnabled}
            >
              {t('step', { current: currentStep, max: totalSteps })}
            </StyledText>
          ) : null}
        </Flex>
        <Btn onClick={exit}>
          <StyledText
            css={TYPOGRAPHY.pSemiBold}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            color={COLORS.darkGreyEnabled}
          >
            {t('exit')}
          </StyledText>
        </Btn>
      </Flex>
      <Box css={progressBarContainer}>
        <Box css={progressBar} />
      </Box>
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
