import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { UnMatchedModuleWarning } from '../UnMatchedModuleWarning'

const render = () => {
  return renderWithProviders(<UnMatchedModuleWarning />, {
    i18nInstance: i18n,
  })[0]
}

describe('UnMatchedModuleWarning', () => {
  it('should render the correct title', () => {
    const { getByText } = render()
    getByText('Extra module attached')
  })
  it('should render the correct body, clicking on exit button closes banner', () => {
    const { getByText, getByTestId } = render()
    getByText(
      'Check that the modules connected to this robot are of the right type and generation.'
    )
    const exit = getByTestId('Banner_close-button')
    fireEvent.click(exit)
    expect(
      screen.queryByText(
        'Check that the modules connected to this robot are of the right type and generation.'
      )
    ).not.toBeInTheDocument()
  })
})
