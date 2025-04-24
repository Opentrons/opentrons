import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import {
  useCurrentAllSubsystemUpdatesQuery,
  useInstrumentsQuery,
  useSubsystemUpdateQuery,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useIsUnboxingFlowOngoing } from '/app/redux-resources/config'
import { useNotifyCurrentMaintenanceRun } from '/app/resources/maintenance_runs'

import { FirmwareUpdateTakeover } from '../FirmwareUpdateTakeover'
import { UpdateInProgressModal } from '../UpdateInProgressModal'
import { UpdateNeededModal } from '../UpdateNeededModal'

import type { BadPipette, PipetteData } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('../UpdateNeededModal')
vi.mock('../UpdateInProgressModal')
vi.mock('/app/redux-resources/config')
vi.mock('/app/resources/maintenance_runs')

const render = () => {
  return renderWithProviders(<FirmwareUpdateTakeover />, {
    i18nInstance: i18n,
  })[0]
}

describe('FirmwareUpdateTakeover', () => {
  beforeEach(() => {
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: {
        data: [
          {
            subsystem: 'pipette_left',
            ok: false,
          } as BadPipette,
        ],
      },
    } as any)
    vi.mocked(UpdateNeededModal).mockReturnValue(<>Mock Update Needed Modal</>)
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: undefined,
    } as any)
    vi.mocked(useIsUnboxingFlowOngoing).mockReturnValue(false)
    vi.mocked(useCurrentAllSubsystemUpdatesQuery).mockReturnValue({
      data: undefined,
    } as any)
    vi.mocked(useSubsystemUpdateQuery).mockReturnValue({
      data: undefined,
    } as any)
    vi.mocked(UpdateInProgressModal).mockReturnValue(
      <>Mock Update In Progress Modal</>
    )
  })

  it('renders update needed modal when an instrument is not ok', () => {
    render()
    screen.getByText('Mock Update Needed Modal')
  })

  it('does not render modal when no update is needed', () => {
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: {
        data: [
          {
            subsystem: 'pipette_left',
            ok: true,
          } as PipetteData,
        ],
      },
    } as any)
    render()
    expect(
      screen.queryByText('Mock Update Needed Modal')
    ).not.toBeInTheDocument()
  })

  it('does not render modal when a maintenance run is active', () => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {
        runId: 'mock run id',
      },
    } as any)
    render()
    expect(
      screen.queryByText('Mock Update Needed Modal')
    ).not.toBeInTheDocument()
  })

  it('does not not render modal when unboxing flow is not done', () => {
    vi.mocked(useIsUnboxingFlowOngoing).mockReturnValue(true)
    render()
    expect(
      screen.queryByText('Mock Update Needed Modal')
    ).not.toBeInTheDocument()
  })

  it('does not render modal when another update is in progress', () => {
    vi.mocked(useCurrentAllSubsystemUpdatesQuery).mockReturnValue({
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
    vi.mocked(useSubsystemUpdateQuery).mockReturnValue({
      data: {
        data: {
          subsystem: 'pipette_right',
          updateStatus: 20,
        } as any,
      },
    } as any)

    render()
    expect(
      screen.queryByText('Mock Update Needed Modal')
    ).not.toBeInTheDocument()
    //  TODO(jr, 2/27/24): test uses Portal, fix later
    // screen.getByText('Mock Update In Progress Modal')
  })
})
