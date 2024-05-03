import React from 'react'
import styled from 'styled-components'
import { useAtom } from 'jotai'
import { BORDERS, PrimaryButton } from '@opentrons/components'
import {
  reagentTransfer,
  flexReagentTransfer,
  pcr,
  flexPcr,
} from '../../assets/prompts'
import { preparedPromptAtom } from '../../resources/atoms'

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
  const [, setPreparedPrompt] = useAtom(preparedPromptAtom)
  const handleClick = (): void => {
    const { prompt } = PROMPT_BY_NAME[buttonText]
    setPreparedPrompt(prompt)
  }

  return <PromptBtn onClick={handleClick}>{buttonText}</PromptBtn>
}

const PromptBtn = styled(PrimaryButton)`
  border-radius: ${BORDERS.borderRadiusFull};
  white-space: nowrap;
`
