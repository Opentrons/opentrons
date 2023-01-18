import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { Welcome } from '../Welcome'

const PNG_FILE_NAME = 'odd_abstract@x2.png'

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
    const [{ getByText, getByRole }] = render()
    getByText('Welcome to your OT-3!')
    getByText(
      "Quickly run protocols and check on your robot's status right on your lab bench."
    )
    getByRole('button', { name: 'Get started' })
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(PNG_FILE_NAME)
  })

  it('should call mockPush when tapping Get started', () => {
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Get started' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/network-setup')
  })
})
