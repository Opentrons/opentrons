import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { COLORS } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { CardButton } from '..'
import type * as ReactRouterDom from 'react-router-dom'

const mockPush = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<typeof ReactRouterDom>()
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof CardButton>) => {
  return renderWithProviders(
    <MemoryRouter>
      <CardButton {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CardButton', () => {
  let props: React.ComponentProps<typeof CardButton>

  beforeEach(() => {
    props = {
      title: 'Wi-Fi',
      iconName: 'wifi',
      description: 'Find a network in your lab or enter your own.',
      destinationPath: '/mockPath',
      disabled: false,
    }
  })

  it('should render text and icon', () => {
    render(props)
    screen.getByText('Wi-Fi')
    screen.getByText('Find a network in your lab or enter your own.')
    expect(screen.getByTestId('cardButton_icon_wifi')).toBeInTheDocument()
    const button = screen.getByRole('button')
    expect(button).toHaveStyle(`background-color: ${COLORS.blue35}`)
  })

  it('renders the button as disabled', () => {
    props = {
      ...props,
      disabled: true,
    }
    render(props)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should call mock function with path when tapping a card', () => {
    render(props)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/mockPath')
  })
})
