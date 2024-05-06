import React from 'react'
import { useAtom } from 'jotai'
import { fireEvent, screen, renderHook } from '@testing-library/react'
import { describe, it, beforeEach, expect } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { reagentTransfer } from '../../../assets/prompts'
import { preparedPromptAtom } from '../../../resources/atoms'
import { PromptButton } from '../index'

const render = (props: React.ComponentProps<typeof PromptButton>) => {
  return renderWithProviders(<PromptButton {...props} />)
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
    const { result } = renderHook(() => useAtom(preparedPromptAtom))
    fireEvent.click(button)
    expect(result.current[0]).toBe(reagentTransfer)
  })
})
