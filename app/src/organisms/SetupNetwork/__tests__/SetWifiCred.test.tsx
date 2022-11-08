import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { SetWifiCred } from '../SetWifiCred'

const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: { push: mockPush } as any,
  }
})

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <SetWifiCred />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('SetWifiCred', () => {
  it('should render text, button and software keyboard', () => {
    const [{ getByText, getByRole }] = render()
    getByText('')
  })
  it('should display a dot when typing a char', () => {})
  it('should switch the input type when tapping the icon next to the input', () => {})
  it('should call mock function when tapping back', () => {})
  it('should call mock function when tapping connect', () => {})
})
