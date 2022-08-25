import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  HandleKeypress,
  TYPOGRAPHY,
  COLORS,
  SPACING,
  Icon,
  DIRECTION_COLUMN,
  Flex,
  DIRECTION_ROW,
  TEXT_TRANSFORM_CAPITALIZE,
  Box,
} from '@opentrons/components'
import { ControlContainer } from './ControlContainer'

import { StyledText } from '../../atoms/text'
import { css } from 'styled-components'
import { PrimaryButton } from '../../atoms/buttons'

import type { StepSize } from './types'

interface StepSizeControlProps {
  stepSizes: StepSize[]
  currentStepSize: StepSize
  setCurrentStepSize: (stepSize: StepSize) => void
}
export function StepSizeControl(props: StepSizeControlProps): JSX.Element {
  const { stepSizes, currentStepSize, setCurrentStepSize } = props
  const { t } = useTranslation(['robot_calibration'])

  const STEP_SIZE_TITLE = t('jump_size')
  const STEP_SIZE_SUBTITLE = '- / +'

  const increaseStepSize: () => void = () => {
    const i = stepSizes.indexOf(currentStepSize)
    if (i < stepSizes.length - 1) setCurrentStepSize(stepSizes[i + 1])
  }

  const decreaseStepSize: () => void = () => {
    const i = stepSizes.indexOf(currentStepSize)
    if (i > 0) setCurrentStepSize(stepSizes[i - 1])
  }

  const handleStepSelect = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    setCurrentStepSize(Number(event.currentTarget.value))
    event.currentTarget.blur()
  }

  const JUMP_SIZE_ICON_STYLE = css`
    flex-shrink: 0;
  `

  const STEP_SIZE_LABELS: { [stepSize: number]: string } = {
    0.1: t('tiny'),
    1: t('small'),
    10: t('large'),
  }

  const BUTTON_WRAPPER_STYLE = css`
    display: grid;
    grid-auto-flow: column;
    grid-gap: ${SPACING.spacing3};
    margin-top: ${SPACING.spacing4};

    @media (max-width: 750px) {
      grid-template-columns: none;
      grid-template-rows: repeat(3, minmax(auto, 50%));
    }
  `

  const DEFAULT_BUTTON_STYLE = css`
    background-color: ${COLORS.white};
    height: 3.62rem;
    color: ${COLORS.black};

    &:hover {
      background-color: ${COLORS.white};
      color: ${COLORS.black};
      box-shadow: 0 0 0;
      border: 1px ${COLORS.lightGreyHover} solid;
    }

    &:active {
      background-color: ${COLORS.white};
      color: ${COLORS.blueEnabled};
      border: 1px ${COLORS.blueEnabled} solid;
    }

    &:disabled {
      background-color: inherit;
      color: ${COLORS.errorDisabled};
    }
  `
  const ACTIVE_BUTTON_STYLE = css`
    ${DEFAULT_BUTTON_STYLE}
    color: ${COLORS.blueEnabled};
    border: 1px ${COLORS.blueEnabled} solid;
  `
  return (
    <ControlContainer title={STEP_SIZE_TITLE}>
      <HandleKeypress
        preventDefault
        handlers={[
          { key: '-', onPress: decreaseStepSize },
          { key: '_', onPress: decreaseStepSize },
          { key: '=', onPress: increaseStepSize },
          { key: '+', onPress: increaseStepSize },
        ]}
      >
        <Flex flexDirection={DIRECTION_COLUMN} flex="1">
          <Flex flexDirection={DIRECTION_ROW}>
            <Icon name="jump-size" width="1.2rem" css={JUMP_SIZE_ICON_STYLE} />
            <StyledText
              textTransform={TEXT_TRANSFORM_CAPITALIZE}
              css={TYPOGRAPHY.pSemiBold}
              marginLeft={SPACING.spacing3}
            >
              {STEP_SIZE_TITLE}
            </StyledText>
          </Flex>
          <StyledText
            color={COLORS.darkGreyEnabled}
            css={TYPOGRAPHY.labelRegular}
          >
            {STEP_SIZE_SUBTITLE}
          </StyledText>
          <Box css={BUTTON_WRAPPER_STYLE}>
            {stepSizes.map((stepSize: StepSize, index) => {
              return (
                <PrimaryButton
                  key={index}
                  css={
                    currentStepSize === stepSize
                      ? ACTIVE_BUTTON_STYLE
                      : DEFAULT_BUTTON_STYLE
                  }
                  value={stepSize}
                  onClick={handleStepSelect}
                >
                  {STEP_SIZE_LABELS[stepSize]}
                  <StyledText
                    color={COLORS.darkGreyEnabled}
                    css={TYPOGRAPHY.labelRegular}
                  >{`${stepSize} mm`}</StyledText>
                </PrimaryButton>
              )
            })}
          </Box>
        </Flex>
      </HandleKeypress>
    </ControlContainer>
  )
}
