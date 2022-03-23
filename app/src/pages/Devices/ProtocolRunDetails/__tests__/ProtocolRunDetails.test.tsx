import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'
import { useRobot } from '../../../../organisms/Devices/hooks'
import { ProtocolRunHeader } from '../../../../organisms/Devices/ProtocolRun/ProtocolRunHeader'
import { ProtocolRunDetails } from '..'

jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../../../../organisms/Devices/ProtocolRun/ProtocolRunHeader')

const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockProtocolRunHeader = ProtocolRunHeader as jest.MockedFunction<
  typeof ProtocolRunHeader
>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/devices/:robotName/protocol-runs/:runId/:protocolRunDetailsTab?">
        <ProtocolRunDetails />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ProtocolRunDetails', () => {
  beforeEach(() => {
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockProtocolRunHeader.mockReturnValue(<div>Mock ProtocolRunHeader</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('does not render a ProtocolRunHeader when a robot is not found', () => {
    mockUseRobot.mockReturnValue(null)
    const [{ queryByText }] = render(
      '/devices/otie/protocol-runs/95e67900-bc9f-4fbf-92c6-cc4d7226a51b/setup'
    )

    expect(queryByText('Mock ProtocolRunHeader')).toBeFalsy()
  })

  it('renders a ProtocolRunHeader when a robot is found', () => {
    const [{ getByText }] = render(
      '/devices/otie/protocol-runs/95e67900-bc9f-4fbf-92c6-cc4d7226a51b/setup'
    )

    getByText('Mock ProtocolRunHeader')
  })

  it('renders navigation tabs', () => {
    const [{ getByText }] = render(
      '/devices/otie/protocol-runs/95e67900-bc9f-4fbf-92c6-cc4d7226a51b/setup'
    )

    getByText('Setup')
    getByText('Module Controls')
    getByText('Run Log')
  })

  it('defaults to setup content when given an unspecified tab', () => {
    const [{ getByText }] = render(
      '/devices/otie/protocol-runs/95e67900-bc9f-4fbf-92c6-cc4d7226a51b/this-is-not-a-real-tab'
    )

    getByText('setup content')
  })
})
