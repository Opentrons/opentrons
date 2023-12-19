import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { Welcome } from '../Welcome'

const PNG_FILE_NAME = 'welcome_background.png'

const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <Welcome />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Welcome', () => {
  it('should render text, image, and button', () => {
    render()
    screen.getByText('Welcome to your Opentrons Flex!')
    screen.getByText(
      "Quickly run protocols and check on your robot's status right on your lab bench."
    )
    screen.getByRole('button', { name: 'Get started' })
    const image = screen.getByRole('img')
    expect(image.getAttribute('src')).toEqual(PNG_FILE_NAME)
  })

  it('should call mockPush when tapping Get started', () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))
    expect(mockPush).toHaveBeenCalledWith('/network-setup')
  })
})
