import { vi, it, describe, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'
import { Welcome } from '..'

import type { NavigateFunction } from 'react-router-dom'

const PNG_FILE_NAME = 'welcome_background.png'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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
    expect(image.getAttribute('src')).toContain(PNG_FILE_NAME)
  })

  it('should call mockNavigate when tapping Get started', () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))
    expect(mockNavigate).toHaveBeenCalledWith('/network-setup')
  })
})
