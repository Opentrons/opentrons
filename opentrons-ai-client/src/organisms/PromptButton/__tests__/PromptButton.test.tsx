import React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, beforeEach, expect, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { PromptButton } from '../index'
import type * as ReactHookForm from 'react-hook-form'

vi.mock('react-hook-form', async importOriginal => {
  const actual = await importOriginal<typeof ReactHookForm>()
  return {
    ...actual,
    useFormContext: vi.fn(() => ({
      setValue: mockSetValue,
    })),
  }
})


const render = (props: React.ComponentProps<typeof PromptButton>) => {
  return renderWithProviders(<PromptButton {...props} />)
}

let mockSetValue = vi.fn()

describe('PromptButton', () => {
  let props: React.ComponentProps<typeof PromptButton>
  beforeEach(() => {
    props = {
      buttonText: 'Reagent Transfer',
    }
    mockSetValue = vi.fn()
  })

  it('should render text', () => {
    render(props)
    screen.getByRole('button', { name: 'Reagent Transfer' })
  })

  it('should call a mock function when clicking a button', () => {
    render(props)
    const button = screen.getByRole('button', { name: 'Reagent Transfer' })
    fireEvent.click(button)
    expect(mockSetValue).toHaveBeenCalled()
  })
})
