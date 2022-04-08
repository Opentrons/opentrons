import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'
import { useRobot } from '../../../../organisms/Devices/hooks'
import { ProtocolRunHeader } from '../../../../organisms/Devices/ProtocolRun/ProtocolRunHeader'
import { ProtocolRunSetup } from '../../../../organisms/Devices/ProtocolRun/ProtocolRunSetup'
import { RunLog } from '../../../../organisms/Devices/ProtocolRun/RunLog'
import { ProtocolRunDetails } from '..'

jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../../../../organisms/Devices/ProtocolRun/ProtocolRunHeader')
jest.mock('../../../../organisms/Devices/ProtocolRun/ProtocolRunSetup')
jest.mock('../../../../organisms/Devices/ProtocolRun/RunLog')
jest.mock('../../../../organisms/Labware/helpers/getAllDefs')

const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockProtocolRunHeader = ProtocolRunHeader as jest.MockedFunction<
  typeof ProtocolRunHeader
>
const mockRunLog = RunLog as jest.MockedFunction<typeof RunLog>
const mockProtocolRunSetup = ProtocolRunSetup as jest.MockedFunction<
  typeof ProtocolRunSetup
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
    mockRunLog.mockReturnValue(<div>Mock RunLog</div>)
    mockProtocolRunSetup.mockReturnValue(<div>Mock ProtocolRunSetup</div>)
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

    getByText('Mock ProtocolRunSetup')
  })

  it('renders a run log when the run log tab is clicked', () => {
    const [{ getByText, queryByText }] = render(
      '/devices/otie/protocol-runs/95e67900-bc9f-4fbf-92c6-cc4d7226a51b'
    )

    expect(queryByText('Mock RunLog')).toBeFalsy()
    const runTab = getByText('Run Log')
    runTab.click()
    getByText('Mock RunLog')
  })

  it('renders protocol run setup when the setup tab is clicked', () => {
    const [{ getByText, queryByText }] = render(
      '/devices/otie/protocol-runs/95e67900-bc9f-4fbf-92c6-cc4d7226a51b'
    )

    const setupTab = getByText('Setup')
    const runTab = getByText('Run Log')
    runTab.click()
    getByText('Mock RunLog')
    expect(queryByText('Mock ProtocolRunSetup')).toBeFalsy()
    setupTab.click()
    getByText('Mock ProtocolRunSetup')
  })
})
