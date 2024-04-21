import React, { useCallback } from 'react'
import styled from 'styled-components'
import { BORDERS, PrimaryButton } from '@opentrons/components'
import { setPromptContext } from './PromptProvider'
import {
  reagentTransfer,
  flexReagentTransfer,
  pcr,
  flexPcr,
} from '../../assets/prompts'

interface PromptButtonProps {
  buttonText: string
}

// ToDo (kk:04/22/2024) This record would be needed to be more generic
const PROMPT_BY_NAME: Record<string, { prompt: string }> = {
  'Reagent Transfer': {
    prompt: reagentTransfer,
  },
  'Reagent Transfer (Flex)': {
    prompt: flexReagentTransfer,
  },
  PCR: {
    prompt: pcr,
  },
  'PCR (Flex)': {
    prompt: flexPcr,
  },
}

export function PromptButton({ buttonText }: PromptButtonProps): JSX.Element {
  const usePromptSetValue = () => React.useContext(setPromptContext)
  const setPrompt = usePromptSetValue()

  const handleClick = useCallback(() => {
    const { prompt } = PROMPT_BY_NAME[buttonText]
    setPrompt(prompt)
  }, [setPrompt])

  return <PromptBtn onClick={handleClick}>{buttonText}</PromptBtn>
}

const PromptBtn = styled(PrimaryButton)`
  border-radius: ${BORDERS.borderRadiusFull};
  white-space: nowrap;
`
