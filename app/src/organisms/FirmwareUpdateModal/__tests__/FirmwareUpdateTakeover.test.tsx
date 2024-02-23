import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import {
  useInstrumentsQuery,
  useCurrentAllSubsystemUpdatesQuery,
  useSubsystemUpdateQuery,
} from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { UpdateNeededModal } from '../UpdateNeededModal'
import { UpdateInProgressModal } from '../UpdateInProgressModal'
import { useIsUnboxingFlowOngoing } from '../../RobotSettingsDashboard/NetworkSettings/hooks'
import { FirmwareUpdateTakeover } from '../FirmwareUpdateTakeover'
import { useNotifyCurrentMaintenanceRun } from '../../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun'

import type { BadPipette, PipetteData } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../UpdateNeededModal')
jest.mock('../UpdateInProgressModal')
jest.mock('../../RobotSettingsDashboard/NetworkSettings/hooks')
jest.mock('../../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun')

const mockUseInstrumentQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>
const mockUseNotifyCurrentMaintenanceRun = useNotifyCurrentMaintenanceRun as jest.MockedFunction<
  typeof useNotifyCurrentMaintenanceRun
>
const mockUpdateNeededModal = UpdateNeededModal as jest.MockedFunction<
  typeof UpdateNeededModal
>
const mockUseIsUnboxingFlowOngoing = useIsUnboxingFlowOngoing as jest.MockedFunction<
  typeof useIsUnboxingFlowOngoing
>
const mockUseCurrentAllSubsystemUpdateQuery = useCurrentAllSubsystemUpdatesQuery as jest.MockedFunction<
  typeof useCurrentAllSubsystemUpdatesQuery
>
const mockUseSubsystemUpdateQuery = useSubsystemUpdateQuery as jest.MockedFunction<
  typeof useSubsystemUpdateQuery
>
const mockUpdateInProgressModal = UpdateInProgressModal as jest.MockedFunction<
  typeof UpdateInProgressModal
>

const render = () => {
  return renderWithProviders(<FirmwareUpdateTakeover />, {
    i18nInstance: i18n,
  })[0]
}

describe('FirmwareUpdateTakeover', () => {
  beforeEach(() => {
    mockUseInstrumentQuery.mockReturnValue({
      data: {
        data: [
          {
            subsystem: 'pipette_left',
            ok: false,
          } as BadPipette,
        ],
      },
    } as any)
    mockUpdateNeededModal.mockReturnValue(<>Mock Update Needed Modal</>)
    mockUseNotifyCurrentMaintenanceRun.mockReturnValue({
      data: undefined,
    } as any)
    mockUseIsUnboxingFlowOngoing.mockReturnValue(false)
    mockUseCurrentAllSubsystemUpdateQuery.mockReturnValue({
      data: undefined,
    } as any)
    mockUseSubsystemUpdateQuery.mockReturnValue({
      data: undefined,
    } as any)
    mockUpdateInProgressModal.mockReturnValue(
      <>Mock Update In Progress Modal</>
    )
  })

  it('renders update needed modal when an instrument is not ok', () => {
    const { getByText } = render()
    getByText('Mock Update Needed Modal')
  })

  it('does not render modal when no update is needed', () => {
    mockUseInstrumentQuery.mockReturnValue({
      data: {
        data: [
          {
            subsystem: 'pipette_left',
            ok: true,
          } as PipetteData,
        ],
      },
    } as any)
    const { queryByText } = render()
    expect(queryByText('Mock Update Needed Modal')).not.toBeInTheDocument()
  })

  it('does not render modal when a maintenance run is active', () => {
    mockUseNotifyCurrentMaintenanceRun.mockReturnValue({
      data: {
        runId: 'mock run id',
      },
    } as any)
    const { queryByText } = render()
    expect(queryByText('Mock Update Needed Modal')).not.toBeInTheDocument()
  })

  it('does not not render modal when unboxing flow is not done', () => {
    mockUseIsUnboxingFlowOngoing.mockReturnValue(true)
    const { queryByText } = render()
    expect(queryByText('Mock Update Needed Modal')).not.toBeInTheDocument()
  })

  it('does not render modal when another update is in progress', () => {
    mockUseCurrentAllSubsystemUpdateQuery.mockReturnValue({
      data: {
        data: [
          {
            id: '123',
            createdAt: 'today',
            subsystem: 'pipette_right',
            updateStatus: 'updating',
          },
        ],
      },
    } as any)
    mockUseSubsystemUpdateQuery.mockReturnValue({
      data: {
        data: {
          subsystem: 'pipette_right',
          updateStatus: 20,
        } as any,
      },
    } as any)

    const { queryByText, getByText } = render()
    expect(queryByText('Mock Update Needed Modal')).not.toBeInTheDocument()
    getByText('Mock Update In Progress Modal')
  })
})
