import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { Navbar } from '../Navbar'

import type { RouteProps } from '../types'

const ROUTE_PROPS: RouteProps[] = [
  { name: 'foo', navLinkTo: '/foo', path: '/foo', Component: () => null },
  { name: 'bar', navLinkTo: '/bar', path: '/bar', Component: () => null },
  { name: 'baz', navLinkTo: '/baz', path: '/baz', Component: () => null },
]

describe('Navbar', () => {
  it('should render a NavbarLink for every nav location', () => {
    renderWithProviders(
      <MemoryRouter>
        <Navbar routes={ROUTE_PROPS} />
      </MemoryRouter>,
      { i18nInstance: i18n }
    )
    screen.getByRole('link', { name: 'foo' })
    screen.getByRole('link', { name: 'bar' })
    screen.getByRole('link', { name: 'baz' })
  })

  it('should render logo, settings, and help', () => {
    renderWithProviders(
      <MemoryRouter>
        <Navbar routes={ROUTE_PROPS} />
      </MemoryRouter>,
      { i18nInstance: i18n }
    )
    screen.getByRole('button', { name: 'App Settings' })
    screen.getByRole('link', { name: 'Help' })

    screen.getByLabelText('Settings icon')
    screen.getByLabelText('Help icon')
  })
})
