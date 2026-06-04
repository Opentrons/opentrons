import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCommandTextString } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useNotifyCurrentMaintenanceRun } from '/app/resources/maintenance_runs'

import { ActionsView } from '../ActionsView'

import type { DocumentedAction } from '@opentrons/react-api-client'
import type { PipetteWizardFlowName } from '@opentrons/react-api-client/src/access_control/types'
import type { RunTimeCommand } from '@opentrons/shared-data'

vi.mock('/app/resources/maintenance_runs')
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
    screen.getByText('Playing protocol')
    screen.getByText('Stopping protocol run')
  })

  it('renders pipette wizard flow names as raw text when pipette wizard flow', () => {
    renderWithModal(['Attach pipette to left mount' as PipetteWizardFlowName])
    screen.getByText('Attach pipette to left mount')
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

  it('renders stringified runtime commands when maintenance run data is unavailable', () => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: undefined,
    } as any)

    renderWithModal([HOME_COMMAND])
    screen.getByText(JSON.stringify(HOME_COMMAND))
    expect(useCommandTextString).not.toHaveBeenCalled()
  })

  it('closes the modal when the exit icon is clicked', () => {
    renderWithModal(['play_run'])
    screen.getByText('Actions requiring documentation')

    fireEvent.click(screen.getByLabelText('closeIcon'))

    expect(screen.queryByText('Actions requiring documentation')).toBeNull()
  })
})
