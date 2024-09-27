import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { UnMatchedModuleWarning } from '../UnMatchedModuleWarning'

const render = () => {
  return renderWithProviders(<UnMatchedModuleWarning />, {
    i18nInstance: i18n,
  })[0]
}

describe('UnMatchedModuleWarning', () => {
  it('should render the correct title', () => {
    render()
    screen.getByText('Extra module attached')
  })
  it('should render the correct body, clicking on exit button closes banner', () => {
    render()
    screen.getByText(
      'Check that the modules connected to this robot are of the right type and generation.'
    )
    const exit = screen.getByTestId('Banner_close-button')
    fireEvent.click(exit)
    expect(
      screen.queryByText(
        'Check that the modules connected to this robot are of the right type and generation.'
      )
    ).not.toBeInTheDocument()
  })
})
