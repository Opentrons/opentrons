import React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useForm } from 'react-hook-form'

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
import { promptContext } from '../../organisms/PromptButton/PromptProvider'
import type { SubmitHandler } from 'react-hook-form'

// ToDo (kk:04/19/2024) Note this interface will be used by prompt buttons in SidePanel
// interface InputPromptProps {}

interface InputType {
  userPrompt: string
}

export function InputPrompt(/* props: InputPromptProps */): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const { register, handleSubmit, watch, setValue } = useForm<InputType>({
    defaultValues: {
      userPrompt: '',
    },
  })
  const usePromptValue = (): string => React.useContext(promptContext)
  const promptFromButton = usePromptValue()
  const userPrompt = watch('userPrompt') ?? ''

  const onSubmit: SubmitHandler<InputType> = async data => {
    // ToDo (kk: 04/19/2024) call api
    const { userPrompt } = data
    console.log('user prompt', userPrompt)
  }

  const calcTextAreaHeight = (): number => {
    const rowsNum = userPrompt.split('\n').length
    return rowsNum
  }

  React.useEffect(() => {
    if (promptFromButton !== '') setValue('userPrompt', promptFromButton)
  }, [promptFromButton, setValue])

  return (
    <StyledForm id="User_Prompt" onSubmit={() => handleSubmit(onSubmit)}>
      <Flex
        padding={SPACING.spacing40}
        gridGap={SPACING.spacing40}
        flexDirection={DIRECTION_ROW}
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius4}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        maxHeight="21.25rem"
      >
        <StyledTextarea
          rows={calcTextAreaHeight()}
          placeholder={t('type_your_prompt')}
          {...register('userPrompt')}
        />
        <PlayButton disabled={userPrompt.length === 0} />
      </Flex>
    </StyledForm>
  )
}

const StyledForm = styled.form`
  width: 100%;
`

const StyledTextarea = styled.textarea`
  resize: none;
  min-height: 3.75rem;
  max-height: 17.25rem;
  overflow-y: auto;
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
      disabled={disabled || isLoading}
      onClick={onPlay}
      aria-label="play"
      css={playButtonStyle}
      type="submit"
    >
      <Icon
        color={disabled ? COLORS.grey50 : COLORS.white}
        name={isLoading ? 'ot-spinner' : 'send'}
        spin={isLoading}
        size="2rem"
      />
    </Btn>
  )
}
