import * as React from 'react'
import { screen } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { useMaintenanceRunTakeover as mockUseMaintenanceRunTakeover } from '../useMaintenanceRunTakeover'
import { MaintenanceRunTakeover } from '../MaintenanceRunTakeover'
import type { MaintenanceRunStatus } from '../MaintenanceRunStatusProvider'

jest.mock('../useMaintenanceRunTakeover')

const MOCK_MAINTENANCE_RUN: MaintenanceRunStatus = {
  getRunIds: () => ({
    currentRunId: null,
    oddRunId: null,
  }),
  setOddRunIds: () => null,
}

const useMaintenanceRunTakeover = mockUseMaintenanceRunTakeover as jest.MockedFunction<
  typeof mockUseMaintenanceRunTakeover
>

const render = (props: React.ComponentProps<typeof MaintenanceRunTakeover>) => {
  return renderWithProviders(<MaintenanceRunTakeover {...props} />, {
    i18nInstance: i18n,
  })
}

describe('MaintenanceRunTakeover', () => {
  let props: React.ComponentProps<typeof MaintenanceRunTakeover>
  const testComponent = <div>{'Test Component'}</div>

  beforeEach(() => {
    props = { children: [testComponent] }
    when(useMaintenanceRunTakeover)
      .calledWith()
      .mockReturnValue(MOCK_MAINTENANCE_RUN)
  })

  it('renders child components successfuly', () => {
    render(props)
    screen.getByText('Test Component')
  })

  it('does not render a takeover modal if no maintenance run has been initiated', () => {
    render(props)

    expect(screen.queryByText('Robot is busy')).not.toBeInTheDocument()
  })

  it('does not render a takeover modal if a maintenance run has been initiated by the ODD', () => {
    const MOCK_ODD_RUN = {
      ...MOCK_MAINTENANCE_RUN,
      getRunIds: () => ({
        currentRunId: 'testODD',
        oddRunId: 'testODD',
      }),
    }

    when(useMaintenanceRunTakeover).calledWith().mockReturnValue(MOCK_ODD_RUN)

    render(props)
    expect(screen.queryByText('Robot is busy')).not.toBeInTheDocument()
  })

  it('renders a takeover modal if a maintenance run has been initiated by the desktop', () => {
    const MOCK_DESKTOP_RUN = {
      ...MOCK_MAINTENANCE_RUN,
      getRunIds: () => ({
        currentRunId: 'testRunDesktop',
        oddRunId: null,
      }),
    }

    when(useMaintenanceRunTakeover)
      .calledWith()
      .mockReturnValue(MOCK_DESKTOP_RUN)

    render(props)
    screen.getByText('Robot is busy')
  })
})
