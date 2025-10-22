import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_GRID,
  Flex,
  HandleKeypress,
  Icon,
  SPACING,
  StyledText,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TouchControlButton } from '/app/atoms/buttons/TouchControlButton'

import { ControlContainer } from './ControlContainer'

import type { StepSize } from './types'

const JUMP_SIZE_SUBTITLE = '- / +'

const StyledIcon = styled(Icon)`
  flex-shrink: 0;
`

const stepSizeTranslationKeyByStep: { [stepSize: number]: string } = {
  0.1: 'tiny',
  1: 'small',
  10: 'large',
}

const BUTTON_WRAPPER_STYLE = css`
  display: ${DISPLAY_GRID};
  grid-auto-flow: column;
  grid-gap: ${SPACING.spacing8};
  margin-top: ${SPACING.spacing16};

  @media (max-width: 750px) {
    grid-template-columns: none;
    grid-template-rows: repeat(3, minmax(auto, 50%));
  }
`

interface StepSizeControlProps {
  stepSizes: StepSize[]
  currentStepSize: StepSize
  setCurrentStepSize: (stepSize: StepSize) => void
}

function StepSizeButtons({
  stepSizes,
  currentStepSize,
  setCurrentStepSize,
}: StepSizeControlProps): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  return (
    <>
      {stepSizes.map((stepSize: StepSize) => (
        <TouchControlButton
          key={stepSize}
          isActive={currentStepSize === stepSize}
          onClick={() => {
            setCurrentStepSize(stepSize)
          }}
          text1={t(stepSizeTranslationKeyByStep[stepSize])}
          text2={`${stepSize} mm`}
        />
      ))}
    </>
  )
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
            <StyledIcon name="jump-size" width="1.2rem" />
            <StyledText
              textTransform={TEXT_TRANSFORM_CAPITALIZE}
              css={TYPOGRAPHY.pSemiBold}
              marginLeft={SPACING.spacing8}
            >
              {t('jump_size')}
            </StyledText>
          </Flex>
          <StyledText
            color={COLORS.grey60}
            css={TYPOGRAPHY.bodyTextSemiBold}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
          >
            {JUMP_SIZE_SUBTITLE}
          </StyledText>
          <Box css={BUTTON_WRAPPER_STYLE}>
            <StepSizeButtons
              stepSizes={stepSizes}
              currentStepSize={currentStepSize}
              setCurrentStepSize={setCurrentStepSize}
            />
          </Box>
        </Flex>
      </HandleKeypress>
    </ControlContainer>
  )
}

export function TouchStepSizeControl(props: StepSizeControlProps): JSX.Element {
  const { i18n, t } = useTranslation('robot_calibration')
  return (
    <Flex
      flex="3"
      flexDirection={DIRECTION_COLUMN}
      border={`1px solid ${COLORS.grey50}`}
      borderRadius={BORDERS.borderRadius16}
      padding={SPACING.spacing16}
      gridGap={SPACING.spacing16}
    >
      <TouchControlLabel>
        {i18n.format(t('jump_size'), 'capitalize')}
      </TouchControlLabel>

      <StepSizeButtons {...props} />
    </Flex>
  )
}

const TouchControlLabel = styled.p`
  font-size: ${TYPOGRAPHY.fontSize20};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight24};
`
