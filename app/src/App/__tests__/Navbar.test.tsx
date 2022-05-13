import * as React from 'react'
import { render } from '@testing-library/react'
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
    const { getByRole } = render(
      <StaticRouter>
        <Navbar routes={ROUTE_PROPS} />
      </StaticRouter>
    )
    getByRole('link', { name: 'foo' })
    getByRole('link', { name: 'bar' })
    getByRole('link', { name: 'baz' })
  })
  it('should render logo, settings, and help', () => {
    const { getByRole, getByTestId } = render(
      <StaticRouter>
        <Navbar routes={ROUTE_PROPS} />
      </StaticRouter>
    )
    getByRole('img', { name: 'opentrons logo' })
    getByTestId('Navbar_settingsLink')
    getByTestId('Navbar_helpLink')
  })
})
