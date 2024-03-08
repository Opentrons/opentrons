import * as React from 'react'
import { describe, it } from 'vitest'
import { screen, render } from '@testing-library/react'
import { StaticRouter } from 'react-router-dom'

import { Navbar } from '../Navbar'

import type { RouteProps } from '..//types'

const ROUTE_PROPS: RouteProps[] = [
  { name: 'foo', navLinkTo: '/foo', path: '/foo', Component: () => null },
  { name: 'bar', navLinkTo: '/bar', path: '/bar', Component: () => null },
  { name: 'baz', navLinkTo: '/baz', path: '/baz', Component: () => null },
]

describe('Navbar', () => {
  it('should render a NavbarLink for every nav location', () => {
    render(
      <StaticRouter>
        <Navbar routes={ROUTE_PROPS} />
      </StaticRouter>
    )
    screen.getByRole('link', { name: 'foo' })
    screen.getByRole('link', { name: 'bar' })
    screen.getByRole('link', { name: 'baz' })
  })
  it('should render logo, settings, and help', () => {
    render(
      <StaticRouter>
        <Navbar routes={ROUTE_PROPS} />
      </StaticRouter>
    )
    screen.getByRole('img', { name: 'opentrons logo' })
    screen.getByTestId('Navbar_settingsLink')
    screen.getByTestId('Navbar_helpLink')
  })
})
