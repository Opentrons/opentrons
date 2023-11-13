import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { NoUpdateFound } from '../NoUpdateFound'

const mockOnContinue = jest.fn()

const render = () => {
  return renderWithProviders(<NoUpdateFound onContinue={mockOnContinue} />, {
    i18nInstance: i18n,
  })
}

describe('NoUpdateFound', () => {
  it('should render text, icon and button', () => {
    const [{ getByText, getByTestId }] = render()
    getByText('Your software is already up to date!')
    expect(getByTestId('NoUpdateFound_check_circle_icon')).toBeInTheDocument()
    getByText('Continue')
  })

  it('should call mock function when tapping next button', () => {
    const [{ getByText }] = render()
    getByText('Continue').click()
    expect(mockOnContinue).toBeCalled()
  })
})
