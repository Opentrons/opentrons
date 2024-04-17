import React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

// interface InputPromptProps {}

export function InputPrompt(/* props: InputPromptProps */): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  return (
    <Flex
      padding={SPACING.spacing40}
      gridGap={SPACING.spacing40}
      flexDirection={DIRECTION_ROW}
      backgroundColor={COLORS.white}
      borderRadisu={BORDERS.borderRadius4}
      width="930px"
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
    >
      {/* textarea */}
      <StyledTextarea rows={1} placeholder={t('type_your_prompt')} />
      {/* button: play button/stop button */}
      <PlayButton />
    </Flex>
  )
}

const StyledTextarea = styled.textarea`
  min-height: 3.75rem;
  background-color: ${COLORS.white};
  border: none;
  outline: none;
  padding: 0;
  box-shadow: none;
  color: ${COLORS.black90};
  width: 100%;
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
  ::placeholder {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
`

interface PlayButtonProps {
  onPlay?: () => void
  disabled?: boolean
  isLoading?: boolean
}

function PlayButton({
  onPlay,
  disabled = false,
  isLoading = false,
}: PlayButtonProps): JSX.Element {
  const playButtonStyle = css`
    -webkit-tap-highlight-color: transparent;
    &:focus {
      background-color: ${COLORS.blue60};
      color: ${COLORS.white};
    }

    &:hover {
      background-color: ${COLORS.blue50};
      color: ${COLORS.white};
    }

    &:focus-visible {
      /* box-shadow: ${ODD_FOCUS_VISIBLE}; */
      background-color: ${COLORS.blue50};
    }

    &:active {
      background-color: ${COLORS.blue60};
      color: ${COLORS.white};
    }

    &:disabled {
      background-color: ${COLORS.grey35};
      color: ${COLORS.grey50};
    }
  `
  return (
    <Btn
      alignItems={ALIGN_CENTER}
      backgroundColor={disabled ? COLORS.grey35 : COLORS.blue50}
      borderRadius={BORDERS.borderRadiusFull}
      display={DISPLAY_FLEX}
      justifyContent={JUSTIFY_CENTER}
      width="4.25rem"
      height="3.75rem"
      disabled={disabled}
      onClick={onPlay}
      aria-label="play"
      css={playButtonStyle}
    >
      <Icon
        color={disabled ? COLORS.grey50 : COLORS.white}
        name="send"
        size="2rem"
      />
    </Btn>
  )
}
