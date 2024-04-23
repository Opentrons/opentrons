import React from 'react'
import { describe, it, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { InputPrompt } from '../index'

const render = () => {
  return renderWithProviders(<InputPrompt />, { i18nInstance: i18n })
}

describe('InputPrompt', () => {
  it('should render textarea and disabled button', () => {
    render()
    screen.getByRole('textbox')
    screen.queryByPlaceholderText('Type your prompt...')
    screen.getByRole('button')
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should make send button not disabled when a user inputs something in textarea', () => {
    render()
    const textbox = screen.getByRole('textbox')
    fireEvent.change(textbox, { target: { value: ['test'] } })
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  // ToDo (kk:04/19/2024) add more test cases
})
