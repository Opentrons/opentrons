import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mockVacuumModule } from '@opentrons/api-client'
import { VACUUM_MODULE_V1_FIXTURE } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockAttachedPipetteInformation } from '/app/resources/instruments/__fixtures__'

import { VerifyVacuumInstall } from '../VerifyVacuumInstall'

import type { ComponentProps } from 'react'
import type { CutoutConfig, DeckConfiguration } from '@opentrons/shared-data'

const render = (props: ComponentProps<typeof VerifyVacuumInstall>) => {
  return renderWithProviders(<VerifyVacuumInstall {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockDeckConfig: DeckConfiguration = [
  {
    cutoutId: 'cutoutA3',
    cutoutFixtureId: VACUUM_MODULE_V1_FIXTURE,
    opentronsModuleSerialNumber: 'vac123',
  } as CutoutConfig,
]

describe('VerifyVacuumInstall', () => {
  let props: ComponentProps<typeof VerifyVacuumInstall>
  let chainRunCommands: ReturnType<typeof vi.fn>

  beforeEach(() => {
    chainRunCommands = vi
      .fn()
      .mockResolvedValue([{ data: { status: 'succeeded' } }])
    props = {
      proceed: vi.fn(),
      goBack: vi.fn(),
      restartSetup: vi.fn(),
      chainRunCommands,
      isRobotMoving: false,
      isModuleUpdating: false,
      setIsModuleUpdating: vi.fn(),
      attachedModule: mockVacuumModule,
      attachedPipette: mockAttachedPipetteInformation,
      errorMessage: null,
      setErrorMessage: vi.fn(),
      isDoorOpenError: false,
      setIsDoorOpenError: vi.fn(),
      dismissDoorOpenError: vi.fn(),
      sendIdentifyModule: vi.fn(),
      isOnDevice: false,
      deckConfig: mockDeckConfig,
      maintenanceRunId: 'maintenance-run-id',
      setExitCleanupCommands: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('registers vacuum cleanup commands while mounted', () => {
    const { unmount } = render(props)

    expect(props.setExitCleanupCommands).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          commandType: 'vacuumModule/stopVacuum',
        }),
        expect.objectContaining({
          commandType: 'vacuumModule/openVent',
        }),
      ])
    )

    unmount()

    expect(props.setExitCleanupCommands).toHaveBeenCalledWith([])
  })

  it('renders tube connection instructions first', () => {
    render(props)

    screen.getByText('Check all tube connections')
    screen.getByText(
      'All tubes must be securely connected to maintain an airtight seal.'
    )
    screen.getByText('Push the tube in until it clicks into place.')
  })

  it('shows collar instructions after continuing from tube connections', () => {
    render(props)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    screen.getByText(
      'Install the vacuum collar and block it with a non-filter plate'
    )
    screen.getByText(
      'The collar must be fully seated on the vacuum module. Cover it with a solid, non-filter plate so the system can hold vacuum during this check.'
    )
  })

  it('goes back to the previous wizard step from tube connections', () => {
    render(props)

    fireEvent.click(screen.getByRole('button', { name: 'back' }))

    expect(props.goBack).toHaveBeenCalled()
  })

  it('goes back to tube connections from the collar screen', () => {
    render(props)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'back' }))

    screen.getByText('Check all tube connections')
  })

  it('runs the vacuum pressure command and proceeds on success', async () => {
    render(props)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    screen.getByText('Stand back, verifying vacuum seal')

    await waitFor(() => {
      expect(chainRunCommands).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            commandType: 'vacuumModule/startSetVacuumPressure',
          }),
          expect.objectContaining({
            commandType: 'waitForTasks',
          }),
        ]),
        false
      )
    })
    await waitFor(() => {
      expect(chainRunCommands).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            commandType: 'vacuumModule/stopVacuum',
          }),
        ]),
        true
      )
    })
    await waitFor(() => {
      expect(props.proceed).toHaveBeenCalled()
    })
  })

  it('shows retry and continue anyway after a failed verification', async () => {
    chainRunCommands.mockRejectedValueOnce(new Error('pressure not reached'))
    chainRunCommands.mockResolvedValueOnce([])

    render(props)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await screen.findByText('Vacuum verification failed')
    screen.getByText(
      'The vacuum module did not reach the target pressure. Check tube connections, confirm the collar is installed, and that a non-filter plate is seated on the collar.'
    )
    screen.getByRole('button', { name: /try again/i })
    screen.getByRole('button', { name: 'Continue anyway' })
    expect(
      screen.queryByRole('button', { name: 'Cancel' })
    ).not.toBeInTheDocument()
  })

  it('returns to tube connections when retrying after failure', async () => {
    chainRunCommands.mockRejectedValueOnce(new Error('pressure not reached'))
    chainRunCommands.mockResolvedValueOnce([])

    render(props)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await screen.findByText('Vacuum verification failed')
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    screen.getByText('Check all tube connections')
  })

  it('continues setup when the user chooses continue anyway', async () => {
    chainRunCommands.mockRejectedValueOnce(new Error('pressure not reached'))
    chainRunCommands.mockResolvedValueOnce([])

    render(props)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await screen.findByText('Vacuum verification failed')
    fireEvent.click(screen.getByRole('button', { name: 'Continue anyway' }))

    expect(props.proceed).toHaveBeenCalled()
  })

  it('does not proceed if verification commands are still running', async () => {
    chainRunCommands.mockResolvedValueOnce([{ data: { status: 'running' } }])
    chainRunCommands.mockResolvedValueOnce([])

    render(props)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await screen.findByText('Vacuum verification failed')
    expect(props.proceed).not.toHaveBeenCalled()
  })
})
