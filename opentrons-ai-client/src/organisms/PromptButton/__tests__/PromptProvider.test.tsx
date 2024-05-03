import React from 'react'
import { describe, it, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import {
  PromptProvider,
  promptContext,
  setPromptContext,
} from '../PromptProvider'

const TestComponent = () => {
  const usePromptValue = (): string => React.useContext(promptContext)
  const prompt = usePromptValue()

  const usePromptSetValue = (): React.Dispatch<React.SetStateAction<string>> =>
    React.useContext(setPromptContext)
  const setPrompt = usePromptSetValue()

  return (
    <div>
      <div data-testid="mock_prompt">{prompt}</div>
      <button onClick={() => setPrompt('Test Prompt')}>Prompt</button>
    </div>
  )
}

const render = () => {
  return renderWithProviders(
    <PromptProvider>
      <TestComponent />
    </PromptProvider>
  )
}

describe('PromptProvider', () => {
  it('should render initial value', () => {
    render()
    const prompt = screen.getByTestId('mock_prompt')
    expect(prompt.textContent).toEqual('')
  })

  it('should set a mock prompt', () => {
    render()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Test Prompt')).toBeInTheDocument()
  })
})
