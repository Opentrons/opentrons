import React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useForm } from 'react-hook-form'
import { useAtom } from 'jotai'
import axios from 'axios'
import { useAuth0 } from '@auth0/auth0-react'

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

import type { ChatData } from '../../resources/types'

const url =
  'https://fk0py9eu3e.execute-api.us-east-2.amazonaws.com/sandbox/chat/completion'

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
  // ToDo (kk:05/15/2024) this will be used in the future
  // const [error, setError] = React.useState<string>('')

  const { getAccessTokenSilently } = useAuth0()

  const userPrompt = watch('userPrompt') ?? ''

  const calcTextAreaHeight = (): number => {
    const rowsNum = userPrompt.split('\n').length
    return rowsNum
  }

  const fetchData = async (prompt: string): Promise<void> => {
    if (prompt !== '') {
      setLoading(true)
      try {
        const accessToken = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'sandbox-ai-api',
          },
        })
        const postData = {
          message: prompt,
          fake: false,
        }
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
        const response = await axios.post(url, postData, { headers })
        setData(response.data)
      } catch (err) {
        // setError('Error fetching data from the API.')
        console.error(`error: ${err}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleClick = (): void => {
    const userInput: ChatData = {
      role: 'user',
      reply: userPrompt,
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
    if (submitted && data && !loading) {
      const { role, reply } = data
      const assistantResponse: ChatData = {
        role,
        reply,
      }
      setChatData(chatData => [...chatData, assistantResponse])
      setSubmitted(false)
    }
  }, [data, loading, submitted])

  // ToDo (kk:05/02/2024) This is also temp. Asking the design about error.
  // console.error('error', error)

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
  padding: 1.2rem 0;

  ::placeholder {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
`
