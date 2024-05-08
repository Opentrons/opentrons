import React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useForm } from 'react-hook-form'
import { useAtom } from 'jotai'
import axios from 'axios'

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
import { preparedPromptAtom, chatDataAtom } from '../../resources/atoms'
import { detectSimulate } from '../../resources/utils'

import type { ChatData } from '../../resources/types'

// ToDo (kk:05/02/2024) This url is temporary
const CHAT_ENDPOINT = 'http://localhost:8000/streaming/ask'
// const SIMULATOR_ENDPOINT = ''

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
  const [submitted, setSubmitted] = React.useState<boolean>(false)

  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>('')

  const userPrompt = watch('userPrompt') ?? ''

  const calcTextAreaHeight = (): number => {
    const rowsNum = userPrompt.split('\n').length
    return rowsNum
  }

  const fetchChatData = async (prompt: string): Promise<void> => {
    if (prompt !== '') {
      setLoading(true)
      try {
        const response = await axios.post(CHAT_ENDPOINT, {
          headers: {
            'Content-Type': 'application/json',
          },
          query: prompt,
        })
        setData(response.data)
      } catch (err) {
        setError('Error fetching data from the API.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleClick = (): void => {
    // Note (kk:05/07/2024) if user prompt is to simulate a protocol
    // call fetchSimulateResult
    if (detectSimulate(userPrompt)) {
      console.log('call simulator api')
    } else {
      const userInput: ChatData = {
        role: 'user',
        content: userPrompt,
      }
      setChatData(chatData => [...chatData, userInput])
      void fetchChatData(userPrompt)
    }

    setSubmitted(true)
    reset()
  }

  React.useEffect(() => {
    if (preparedPrompt !== '') setValue('userPrompt', preparedPrompt as string)
  }, [preparedPrompt, setValue])

  React.useEffect(() => {
    if (submitted && data && !loading) {
      const { role, content } = data.data
      const assistantResponse: ChatData = {
        role,
        content,
      }
      setChatData(chatData => [...chatData, assistantResponse])
      setSubmitted(false)
    }
  }, [data, loading, submitted])

  // ToDo (kk:05/02/2024) This is also temp. Asking the design about error.
  console.error('error', error)

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
