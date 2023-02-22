import * as React from 'react'
import { useSelector } from 'react-redux'
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
import { getIsOnDevice } from '../../redux/config'

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
  color: ${COLORS.darkGreyEnabled};

  &:hover {
    opacity: 70%;
  }
`
const ON_DEVICE_BUTTON_STYLE = css`
  margin-right: 1.75rem;
  font-size: 1.375rem;
  font-weight: 700;
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  color: ${COLORS.darkGreyEnabled};
`

export const WizardHeader = (props: WizardHeaderProps): JSX.Element => {
  const { totalSteps, currentStep, title, onExit, exitDisabled } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('shared')

  return (
    <Box backgroundColor={COLORS.white}>
      <Flex
        padding={
          isOnDevice
            ? `28px`
            : `${String(SPACING.spacing4)} ${String(SPACING.spacing6)}`
        }
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection={DIRECTION_ROW}>
          <StyledText
            css={
              isOnDevice
                ? css`
                    font-size: 1.375rem;
                    font-weight: 700;
                  `
                : TYPOGRAPHY.pSemiBold
            }
            marginRight={SPACING.spacing3}
          >
            {title}
          </StyledText>

          {currentStep != null && totalSteps != null && currentStep > 0 ? (
            <StyledText
              css={
                isOnDevice
                  ? css`
                      font-size: 1.375rem;
                      font-weight: 700;
                      margin-left: ${SPACING.spacing4};
                    `
                  : TYPOGRAPHY.pSemiBold
              }
              color={COLORS.darkGreyEnabled}
            >
              {t('step', { current: currentStep, max: totalSteps })}
            </StyledText>
          ) : null}
        </Flex>
        {onExit != null ? (
          <Btn onClick={onExit} aria-label="Exit" disabled={exitDisabled}>
            <StyledText
              css={isOnDevice ? ON_DEVICE_BUTTON_STYLE : EXIT_BUTTON_STYLE}
            >
              {t('exit')}
            </StyledText>
          </Btn>
        ) : null}
      </Flex>
      <StepMeter
        totalSteps={totalSteps ?? 0}
        currentStep={currentStep ?? 0}
        OnDevice={isOnDevice === null ? undefined : isOnDevice}
      />
    </Box>
  )
}
