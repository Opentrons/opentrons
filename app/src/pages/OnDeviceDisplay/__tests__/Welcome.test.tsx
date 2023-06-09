import * as React from 'react'
import { fireEvent } from '@testing-library/react'
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
    const [{ getByText, getByLabelText, getByRole }] = render()
    getByText('Welcome to your Opentrons Flex!')
    getByText(
      "Quickly run protocols and check on your robot's status right on your lab bench."
    )
    getByText('Get started')
    getByLabelText('MediumButton_primary')
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(PNG_FILE_NAME)
  })

  it('should call mockPush when tapping Get started', () => {
    const [{ getByLabelText }] = render()
    const button = getByLabelText('MediumButton_primary')
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/network-setup')
  })
})
