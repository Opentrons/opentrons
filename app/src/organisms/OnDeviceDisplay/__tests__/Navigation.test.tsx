import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { getLocalRobot } from '../../../redux/discovery'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { Navigation } from '../Navigation'

jest.mock('../../../redux/discovery')
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>

const mockComponent = () => null

const mockRoutes = [
  {
    Component: mockComponent,
    exact: true,
    name: 'Get started',
    path: '/get-started',
  },
  {
    Component: mockComponent,
    exact: true,
    name: 'All Protocols',
    navLinkTo: '/protocols',
    path: '/protocols',
  },
  {
    Component: mockComponent,
    exact: true,
    name: 'Instruments',
    navLinkTo: '/attach-instruments',
    path: '/attach-instruments',
  },
  {
    Component: mockComponent,
    exact: true,
    name: 'Settings',
    navLinkTo: '/robot-settings',
    path: '/robot-settings',
  },
]

// Change the name to follow the future name length rule
mockConnectedRobot.name = 'opentrons-dev'

const render = (props: React.ComponentProps<typeof Navigation>) => {
  return renderWithProviders(
    <MemoryRouter>
      <Navigation {...props} />
    </MemoryRouter>
  )
}

describe('Navigation', () => {
  let props: React.ComponentProps<typeof Navigation>
  beforeEach(() => {
    props = {
      routes: mockRoutes,
    }
    mockGetLocalRobot.mockReturnValue(mockConnectedRobot)
  })
  it('should render text and they have attribute', () => {
    const [{ getByRole, queryByText }] = render(props)
    getByRole('link', { name: 'opentrons-dev' }) // because of the truncate function
    const allProtocols = getByRole('link', { name: 'All Protocols' })
    expect(allProtocols).toHaveAttribute('href', '/protocols')

    const instruments = getByRole('link', { name: 'Instruments' })
    expect(instruments).toHaveAttribute('href', '/attach-instruments')

    const settings = getByRole('link', { name: 'Settings' })
    expect(settings).toHaveAttribute('href', '/robot-settings')

    expect(queryByText('Get started')).not.toBeInTheDocument()
  })

  // Note: kj 2023/01/23 overflow menu test case will be added in a following PR.
})
