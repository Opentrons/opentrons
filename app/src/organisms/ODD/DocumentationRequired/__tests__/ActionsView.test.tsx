import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCommandTextString } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useNotifyCurrentMaintenanceRun } from '/app/resources/maintenance_runs'
import {
  useCurrentRunId,
  useMostRecentCompletedAnalysis,
  useNotifyRunQuery,
  useRunLoadedLabwareDefinitionsByUri,
} from '/app/resources/runs'

import { ActionsView } from '../ActionsView'

import type { DocumentedAction } from '@opentrons/react-api-client'
import type { RunTimeCommand } from '@opentrons/shared-data'

vi.mock('/app/resources/maintenance_runs')
vi.mock('/app/resources/runs', () => ({
  useCurrentRunId: vi.fn(),
  useNotifyRunQuery: vi.fn(),
  useMostRecentCompletedAnalysis: vi.fn(),
  useRunLoadedLabwareDefinitionsByUri: vi.fn(),
}))
vi.mock('@opentrons/components', async () => {
  const actual = await vi.importActual('@opentrons/components')
  return {
    ...actual,
    useCommandTextString: vi.fn(() => ({
      kind: 'generic',
      commandText: 'Mock command text',
    })),
  }
})

const HOME_COMMAND = {
  commandType: 'home',
  params: {},
} as RunTimeCommand

const renderWithModal = (actionsToDocument: DocumentedAction[]) => {
  const view = renderWithProviders(
    <NiceModal.Provider>
      <button
        data-testid="showModal"
        onClick={() => {
          void NiceModal.show(ActionsView, { actionsToDocument })
        }}
      />
    </NiceModal.Provider>,
    { i18nInstance: i18n }
  )
  fireEvent.click(screen.getByTestId('showModal'))
  return view
}

describe('ActionsView', () => {
  beforeEach(() => {
    vi.mocked(useCurrentRunId).mockReturnValue(null)
    vi.mocked(useNotifyRunQuery).mockReturnValue({ data: undefined } as any)
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(null)
    vi.mocked(useRunLoadedLabwareDefinitionsByUri).mockReturnValue(null)
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {
        data: {
          pipettes: [],
          labware: [],
          modules: [],
          liquids: [],
        },
      },
    } as any)
    vi.mocked(useCommandTextString).mockReturnValue({
      kind: 'generic',
      commandText: 'Mock command text',
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the modal header', () => {
    renderWithModal([])
    screen.getByText('Actions requiring documentation')
  })

  it('renders audit log actions with translated text', () => {
    renderWithModal(['play_run', 'stop_run'])
    screen.getByText('Starting protocol run')
    screen.getByText('Stopping protocol run')
  })

  it('renders attach module action with translated text', () => {
    renderWithModal([
      {
        type: 'attach_module',
        module: {
          moduleModel: 'magneticModuleV2',
          moduleType: 'magneticModuleType',
          data: {
            engaged: false,
            height: 42,
            status: 'disengaged',
          },
          usbPort: {
            path: '/dev/ot_module_magdeck0',
            port: 1,
            hub: false,
            portGroup: 'unknown',
          },
          id: '123',
          serialNumber: '123',
          hardwareRevision: '1.0',
          firmwareVersion: '1.0',
          hasAvailableUpdate: true,
        },
        step: 'start',
      },
    ])
    screen.getByText('Launching setup flow for Magnetic Module GEN2')
  })

  it('renders pipette wizard flow with pipette category when pipetteInfo is null', () => {
    renderWithModal([
      {
        type: 'pipette_wizard_flow',
        mount: 'left',
        pipette: '96-Channel',
        flowType: 'ATTACH',
        pipetteInfo: null,
        step: 'start',
      },
    ])
    screen.getByText('Attaching 96 channel pipette on left mount')
  })

  it('renders pipette wizard flow with pipette display name when pipetteInfo is provided', () => {
    renderWithModal([
      {
        type: 'pipette_wizard_flow',
        mount: 'right',
        pipette: 'Single-Channel_and_8-Channel',
        flowType: 'CALIBRATE',
        pipetteInfo: { displayName: 'Flex 1-Channel 1000 µL' },
        step: 'end',
      },
    ])
    screen.getByText(
      'Finishing calibrating Flex 1-Channel 1000 µL pipette on right mount'
    )
  })

  it('renders command text for runtime commands when maintenance run data is available', () => {
    renderWithModal([HOME_COMMAND])
    screen.getByText('Mock command text')
    expect(useCommandTextString).toHaveBeenCalledWith(
      expect.objectContaining({
        command: HOME_COMMAND,
        robotType: 'OT-3 Standard',
      })
    )
  })

  it('renders command text for runtime commands when protocol run data is available', () => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: undefined,
    } as any)
    vi.mocked(useCurrentRunId).mockReturnValue('run-id')
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: {
          pipettes: [],
          labware: [],
          modules: [],
          liquids: [],
        },
      },
    } as any)
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue({
      commands: [],
    } as any)
    vi.mocked(useRunLoadedLabwareDefinitionsByUri).mockReturnValue({})

    renderWithModal([HOME_COMMAND])
    screen.getByText('Mock command text')
    expect(useCommandTextString).toHaveBeenCalledWith(
      expect.objectContaining({
        command: HOME_COMMAND,
        robotType: 'OT-3 Standard',
        commandTextData: expect.objectContaining({
          commands: [HOME_COMMAND],
        }),
      })
    )
  })

  it('closes the modal when the exit icon is clicked', () => {
    renderWithModal(['play_run'])
    screen.getByText('Actions requiring documentation')

    fireEvent.click(screen.getByLabelText('closeIcon'))

    expect(screen.queryByText('Actions requiring documentation')).toBeNull()
  })
})
