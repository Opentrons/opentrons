import React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { setPromptContext } from '../PromptProvider'
import { PromptButton } from '../index'

const mockSetPrompt = vi.fn()

const render = (props: React.ComponentProps<typeof PromptButton>) => {
  return renderWithProviders(
    <setPromptContext.Provider value={mockSetPrompt}>
      <PromptButton {...props} />s
    </setPromptContext.Provider>
  )
}

describe('PromptButton', () => {
  let props: React.ComponentProps<typeof PromptButton>
  beforeEach(() => {
    props = {
      buttonText: 'Reagent Transfer',
    }
  })

  it('should render text', () => {
    render(props)
    screen.getByRole('button', { name: 'Reagent Transfer' })
  })

  it('should call a mock function when clicking a button', () => {
    render(props)
    const button = screen.getByRole('button', { name: 'Reagent Transfer' })
    fireEvent.click(button)
    expect(mockSetPrompt).toHaveBeenCalled()
  })
})
