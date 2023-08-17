import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import {
  useInstrumentsQuery,
  useCurrentMaintenanceRun,
} from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { UpdateNeededModal } from '../UpdateNeededModal'
import { useIsUnboxingFlowOngoing } from '../../RobotSettingsDashboard/NetworkSettings/hooks'
import { FirmwareUpdateTakeover } from '../FirmwareUpdateTakeover'
import type { BadPipette, PipetteData } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../UpdateNeededModal')
jest.mock('../../RobotSettingsDashboard/NetworkSettings/hooks')

const mockUseInstrumentQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>
const mockUseCurrentMaintenanceRun = useCurrentMaintenanceRun as jest.MockedFunction<
  typeof useCurrentMaintenanceRun
>
const mockUpdateNeededModal = UpdateNeededModal as jest.MockedFunction<
  typeof UpdateNeededModal
>
const mockUseIsUnboxingFlowOngoing = useIsUnboxingFlowOngoing as jest.MockedFunction<
  typeof useIsUnboxingFlowOngoing
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
    mockUseCurrentMaintenanceRun.mockReturnValue({ data: undefined } as any)
    mockUseIsUnboxingFlowOngoing.mockReturnValue(false)
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
    expect(queryByText('Mock Update In Progress Modal')).not.toBeInTheDocument()
  })

  it('does not render modal when a maintenance run is active', () => {
    mockUseCurrentMaintenanceRun.mockReturnValue({
      data: {
        runId: 'mock run id',
      },
    } as any)
    const { queryByText } = render()
    expect(queryByText('Mock Update In Progress Modal')).not.toBeInTheDocument()
  })

  it('should not render modal when unboxing flow is not done', () => {
    mockUseIsUnboxingFlowOngoing.mockReturnValue(true)
    const { queryByText } = render()
    expect(queryByText('Mock Update In Progress Modal')).not.toBeInTheDocument()
  })
})
