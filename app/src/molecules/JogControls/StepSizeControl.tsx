import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
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
  PrimaryButton,
  BORDERS,
  ALIGN_FLEX_START,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ControlContainer } from './ControlContainer'

import type { StepSize } from './types'
import { TouchControlButton } from './TouchControlButton'

const JUMP_SIZE_SUBTITLE = '- / +'
const JUMP_SIZE_ICON_STYLE = css`
  flex-shrink: 0;
`

const stepSizeTranslationKeyByStep: { [stepSize: number]: string } = {
  0.1: 'tiny',
  1: 'small',
  10: 'large',
}

const BUTTON_WRAPPER_STYLE = css`
  display: grid;
  grid-auto-flow: column;
  grid-gap: ${SPACING.spacing8};
  margin-top: ${SPACING.spacing16};

  @media (max-width: 750px) {
    grid-template-columns: none;
    grid-template-rows: repeat(3, minmax(auto, 50%));
  }
`

const DEFAULT_BUTTON_STYLE = css`
  background-color: ${COLORS.white};
  border: 1px ${COLORS.white} solid;
  height: 3.62rem;
  color: ${COLORS.black};

  &:focus {
    background-color: ${COLORS.white};
  }

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

  &:hover {
    color: ${COLORS.blueHover};
    border: 1px ${COLORS.blueHover} solid;
  }
`
interface StepSizeControlProps {
  stepSizes: StepSize[]
  currentStepSize: StepSize
  setCurrentStepSize: (stepSize: StepSize) => void
}
export function StepSizeControl(props: StepSizeControlProps): JSX.Element {
  const { stepSizes, currentStepSize, setCurrentStepSize } = props
  const { t } = useTranslation(['robot_calibration'])

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
    setCurrentStepSize(Number(event.currentTarget.value) as StepSize)
    event.currentTarget.blur()
  }

  return (
    <ControlContainer title={t('jump_size')}>
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
              marginLeft={SPACING.spacing8}
            >
              {t('jump_size')}
            </StyledText>
          </Flex>
          <StyledText
            color={COLORS.darkGreyEnabled}
            css={TYPOGRAPHY.labelRegular}
          >
            {JUMP_SIZE_SUBTITLE}
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
                  {t(stepSizeTranslationKeyByStep[stepSize])}
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

export function TouchStepSizeControl(props: StepSizeControlProps): JSX.Element {
  const { stepSizes, currentStepSize, setCurrentStepSize } = props
  const { i18n, t } = useTranslation('robot_calibration')
  return (
    <Flex
      flex="3"
      flexDirection={DIRECTION_COLUMN}
      border={`1px solid ${COLORS.darkBlack40}`}
      borderRadius={BORDERS.borderRadiusSize4}
      padding={SPACING.spacing16}
      gridGap={SPACING.spacing16}
    >
      <TouchControlLabel>
        {i18n.format(t('jump_size'), 'capitalize')}
      </TouchControlLabel>
      {stepSizes.map((stepSize: StepSize, index) => {
        const selected = currentStepSize === stepSize
        return (
          <TouchControlButton
            key={index}
            selected={selected}
            onClick={() => {
              setCurrentStepSize(stepSize)
            }}
          >
            <Flex
              flexDirection={DIRECTION_COLUMN}
              alignItems={ALIGN_FLEX_START}
            >
              <StyledText
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                color={selected ? COLORS.white : COLORS.darkBlackEnabled}
              >
                {t(stepSizeTranslationKeyByStep[stepSize])}
              </StyledText>
              <StyledText
                as="p"
                color={selected ? COLORS.white : COLORS.darkBlack70}
              >
                {`${stepSize} mm`}
              </StyledText>
            </Flex>
          </TouchControlButton>
        )
      })}
    </Flex>
  )
}

const TouchControlLabel = styled.p`
  font-size: ${TYPOGRAPHY.fontSize20};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight24};
`
