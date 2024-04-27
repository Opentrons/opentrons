import React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useForm } from 'react-hook-form'
import { useAtom } from 'jotai'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { SendButton } from '../../atoms/SendButton'
import { useFetch } from '../../resources/hooks'
import { preparedPromptAtom, chatDataAtom } from '../../resources/atoms'

import type { ChatData } from '../../resources/types'

interface InputType {
  userPrompt: string
}

export function InputPrompt(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const { register, watch, setValue, reset } = useForm<InputType>({
    defaultValues: {
      userPrompt: '',
    },
  })
  const [preparedPrompt] = useAtom(preparedPromptAtom)
  const [, setChatData] = useAtom(chatDataAtom)
  const [submitted, setSubmitted] = React.useState(false)
  const userPrompt = watch('userPrompt') ?? ''

  const { data: responseData, loading, error, fetchData } = useFetch(userPrompt)
  const calcTextAreaHeight = (): number => {
    const rowsNum = userPrompt.split('\n').length
    return rowsNum
  }

  // const handleClick = (): void => {
  //   const userInput: ChatData = {
  //     role: 'user',
  //     content: userPrompt,
  //   }
  //   console.log('userInput', userInput)
  //   setChatData([...chatData, userInput])

  //   console.log('before fetch', chatData)
  //   void fetchData(userPrompt)
  //   const { role, content } = responseData.choices[0].message
  //   const assistantResponse: ChatData = {
  //     role,
  //     content,
  //   }
  //   setChatData([...chatData, assistantResponse])
  //   reset()
  // }

  const handleClick = (): void => {
    const userInput: ChatData = {
      role: 'user',
      content: userPrompt,
    }
    setChatData(chatData => [...chatData, userInput])
    void fetchData(userPrompt)
    setSubmitted(true)
    reset()
  }

  React.useEffect(() => {
    if (preparedPrompt !== '') setValue('userPrompt', preparedPrompt as string)
  }, [preparedPrompt, setValue])

  React.useEffect(() => {
    if (submitted && responseData && !loading) {
      const { role, content } = responseData.choices[0].message
      const assistantResponse: ChatData = {
        role,
        content,
      }
      setChatData(chatData => [...chatData, assistantResponse])
      setSubmitted(false)
    }
  }, [responseData, loading, submitted])

  return (
    <StyledForm id="User_Prompt">
      <Flex css={CONTAINER_STYLE}>
        <StyledTextarea
          rows={calcTextAreaHeight()}
          placeholder={t('type_your_prompt')}
          {...register('userPrompt')}
        />
        <SendButton
          disabled={userPrompt.length === 0}
          isLoading={loading}
          handleClick={handleClick}
        />
      </Flex>
    </StyledForm>
  )
}

const StyledForm = styled.form`
  width: 100%;
`

const CONTAINER_STYLE = css`
  padding: ${SPACING.spacing40};
  grid-gap: ${SPACING.spacing40};
  flex-direction: ${DIRECTION_ROW};
  background-color: ${COLORS.white};
  border-radius: ${BORDERS.borderRadius4};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  max-height: 21.25rem;

  &:focus-within {
    border: 1px ${BORDERS.styleSolid}${COLORS.blue50};
  }
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
