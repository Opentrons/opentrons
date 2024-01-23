import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useMaintenanceRunTakeover } from '../useMaintenanceRunTakeover'
import { MaintenanceRunTakeover } from '../MaintenanceRunTakeover'
import { useNotifyCurrentMaintenanceRun } from '../../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun'

import type { MaintenanceRunStatus } from '../MaintenanceRunStatusProvider'

jest.mock('../useMaintenanceRunTakeover')
jest.mock('../../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun')

const MOCK_MAINTENANCE_RUN: MaintenanceRunStatus = {
  getRunIds: () => ({
    currentRunId: null,
    oddRunId: null,
  }),
  setOddRunIds: () => null,
}

const mockUseMaintenanceRunTakeover = useMaintenanceRunTakeover as jest.MockedFunction<
  typeof useMaintenanceRunTakeover
>
const useMockNotifyCurrentMaintenanceRun = useNotifyCurrentMaintenanceRun as jest.MockedFunction<
  typeof useNotifyCurrentMaintenanceRun
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
    mockUseMaintenanceRunTakeover.mockReturnValue(MOCK_MAINTENANCE_RUN)
    useMockNotifyCurrentMaintenanceRun.mockReturnValue({
      data: {
        data: {
          id: 'test',
        },
      },
    } as any)
  })

  it('renders child components successfuly', () => {
    const [{ getByText }] = render(props)
    getByText('Test Component')
  })

  it('does not render a takeover modal if no maintenance run has been initiated', () => {
    const [{ queryByText }] = render(props)

    expect(queryByText('Robot is busy')).not.toBeInTheDocument()
  })

  it('does not render a takeover modal if a maintenance run has been initiated by the ODD', () => {
    const MOCK_ODD_RUN = {
      ...MOCK_MAINTENANCE_RUN,
      getRunIds: () => ({
        currentRunId: 'testODD',
        oddRunId: 'testODD',
      }),
    }

    mockUseMaintenanceRunTakeover.mockReturnValue(MOCK_ODD_RUN)

    const [{ queryByText }] = render(props)

    expect(queryByText('Robot is busy')).not.toBeInTheDocument()
  })

  it('renders a takeover modal if a maintenance run has been initiated by the desktop', () => {
    const MOCK_DESKTOP_RUN = {
      ...MOCK_MAINTENANCE_RUN,
      getRunIds: () => ({
        currentRunId: 'testRunDesktop',
        oddRunId: null,
      }),
    }

    mockUseMaintenanceRunTakeover.mockReturnValue(MOCK_DESKTOP_RUN)

    const [{ queryByText }] = render(props)

    expect(queryByText('Robot is busy')).toBeInTheDocument()
  })
})
