import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { NoUpdateFound } from '../NoUpdateFound'

const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = () => {
  return renderWithProviders(<NoUpdateFound />, {
    i18nInstance: i18n,
  })
}

describe('NoUpdateFound', () => {
  it('should render text, icon and button', () => {
    const [{ getByText, getByTestId, getByRole }] = render()
    getByText('Your software is up to date!')
    expect(getByTestId('NoUpdateFound_check_circle_icon')).toBeInTheDocument()
    getByRole('button', { name: 'Next' })
  })

  it('should call mock function when tapping next button', () => {
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Next' })
    fireEvent.click(button)
    expect(mockPush).toBeCalledWith('/robot-settings/rename-robot')
  })
})
