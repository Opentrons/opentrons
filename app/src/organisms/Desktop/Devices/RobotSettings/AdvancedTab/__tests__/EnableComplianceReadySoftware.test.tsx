import { MemoryRouter } from 'react-router-dom'
import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import {
  useAccessControlEnabledMutation,
  useAccessControlEnabledQuery,
  useCreateUserMutation,
  useHost,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useHandleRobotCertImport } from '/app/organisms/Desktop/RobotCertImport/useHandleRobotCertImport'

import { EnableComplianceReadySoftware } from '../EnableComplianceReadySoftware'

import type { UseQueryResult } from 'react-query'
import type { AccessControlEnabledSettingsResponse } from '@opentrons/api-client'
import type { UseHandleRobotCertImportProps } from '/app/organisms/Desktop/RobotCertImport/useHandleRobotCertImport'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/App/portal', () => ({
  getTopPortalEl: () => globalThis.document.body,
}))
vi.mock('/app/redux-resources/robots', () => ({
  useRobot: vi.fn().mockReturnValue({
    name: 'otie',
    ip: '127.0.0.1',
    port: 31950,
    health: { robot_serial: 'MOCKSN' },
  }),
}))
vi.mock('/app/redux/robot-auth/hooks', () => ({
  useAccessTokenForRobot: vi.fn().mockReturnValue(null),
}))
vi.mock('/app/organisms/Desktop/RobotCertImport/useHandleRobotCertImport')

const MOCK_ROBOT_NAME = 'otie'
const MOCK_SERVICE_PIN = 'MOCKSN-0000'
const mockCreateUser = vi.fn()
const mockPatchAccessControlEnabledSettings = vi.fn()

const render = () => {
  return renderWithProviders(
    <NiceModal.Provider>
      <MemoryRouter>
        <EnableComplianceReadySoftware
          isRobotBusy={false}
          robotName={MOCK_ROBOT_NAME}
        />
      </MemoryRouter>
    </NiceModal.Provider>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings EnableComplianceReadySoftware', () => {
  beforeEach(() => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: {
        data: {
          accessControlEnabled: false,
        },
      },
      isLoading: false,
      isSuccess: true,
    } as UseQueryResult<AccessControlEnabledSettingsResponse>)
    vi.mocked(useHost).mockReturnValue({
      hostname: '127.0.0.1',
      port: 31950,
      robotName: MOCK_ROBOT_NAME,
    })
    mockCreateUser.mockResolvedValue({})
    mockPatchAccessControlEnabledSettings.mockResolvedValue({})
    vi.mocked(useCreateUserMutation).mockReturnValue({
      createUser: mockCreateUser,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateUserMutation>)
    vi.mocked(useAccessControlEnabledMutation).mockReturnValue({
      patchAccessControlEnabledSettings: mockPatchAccessControlEnabledSettings,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAccessControlEnabledMutation>)
    // by default the encryption key "verifies" successfully, advancing the wizard
    vi.mocked(useHandleRobotCertImport).mockImplementation(
      ({ onSuccessfulImport }: UseHandleRobotCertImportProps) => ({
        passwordValue: '',
        setPasswordValue: vi.fn(),
        passwordError: null,
        importInProgress: false,
        tryImport: () => {
          onSuccessfulImport()
        },
      })
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render title, disabled chip, description, and button', () => {
    render()
    screen.getByText('Compliance Ready Software')
    screen.getByText('Disabled')
    screen.getByText(
      'Enable to create unique user logins and create an immutable audit trail of robot actions.'
    )
    expect(
      screen.getByRole('button', { name: 'Enable CRS' })
    ).toBeInTheDocument()
  })

  it('should render an enabled chip when access control is enabled', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: {
        data: {
          accessControlEnabled: true,
        },
      },
      isLoading: false,
      isSuccess: true,
    } as UseQueryResult<AccessControlEnabledSettingsResponse>)
    render()
    screen.getByText('Enabled')
    expect(screen.queryByText('Disabled')).toBeNull()
  })

  it('should hide the chip while the query is not successful', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isSuccess: false,
    } as UseQueryResult<AccessControlEnabledSettingsResponse>)
    render()
    expect(screen.queryByText('Enabled')).toBeNull()
    expect(screen.queryByText('Disabled')).toBeNull()
  })

  it('should open the CRS wizard when Enable CRS is clicked', () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Enable CRS' }))
    screen.getByRole('dialog')
    screen.getByText('Enter service PIN')
  })

  it('should navigate through the wizard when every field is valid', async () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Enable CRS' }))

    fireEvent.change(screen.getByLabelText('Service PIN'), {
      target: { value: MOCK_SERVICE_PIN },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable Compliance Ready Software' })
    )
    await screen.findByText('Verify robot encryption key')

    // the encryption key step verifies via useHandleRobotCertImport, which the
    // mock resolves successfully to advance the wizard
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByText('Create Service account')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByText('Create Admin account')

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByLabelText('Legal name'), {
      target: { value: 'Ada Admin' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByText('Create password')

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'sup3r-secret' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'sup3r-secret' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByText('Recovery account details')

    fireEvent.click(screen.getByRole('button', { name: 'Complete setup' }))
    await waitFor(() => {
      expect(screen.queryByText('Recovery account details')).toBeNull()
    })
    expect(mockCreateUser).toHaveBeenCalledWith({
      data: {
        username: 'admin',
        fullName: 'Ada Admin',
        password: 'sup3r-secret',
        accountType: 'admin',
      },
    })
    expect(mockPatchAccessControlEnabledSettings).toHaveBeenCalledWith({
      data: { accessControlEnabled: true },
    })
    expect(mockCreateUser.mock.invocationCallOrder[0]).toBeLessThan(
      mockPatchAccessControlEnabledSettings.mock.invocationCallOrder[0]
    )
  })

  it('should block advancing past a step until its fields are valid', async () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Enable CRS' }))

    fireEvent.change(screen.getByLabelText('Service PIN'), {
      target: { value: 'wrong-pin' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable Compliance Ready Software' })
    )

    await screen.findByText('Incorrect service PIN')
    expect(screen.queryByText('Verify robot encryption key')).toBeNull()
  })

  it('should surface an encryption key error and stay on the step', async () => {
    vi.mocked(useHandleRobotCertImport).mockReturnValue({
      passwordValue: 'bad-key',
      setPasswordValue: vi.fn(),
      passwordError: 'nope',
      importInProgress: false,
      tryImport: vi.fn(),
    })

    render()
    fireEvent.click(screen.getByRole('button', { name: 'Enable CRS' }))
    fireEvent.change(screen.getByLabelText('Service PIN'), {
      target: { value: MOCK_SERVICE_PIN },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable Compliance Ready Software' })
    )
    await screen.findByText('Verify robot encryption key')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    await screen.findByText('Invalid encryption key. Try again.')
    expect(screen.queryByText('Create Service account')).toBeNull()
  })
})
