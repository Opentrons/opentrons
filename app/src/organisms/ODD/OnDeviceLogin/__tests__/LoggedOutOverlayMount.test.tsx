import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { useLocalRobotAuthSelf } from '/app/resources/auth'

import { LoggedOutOverlayMount } from '../LoggedOutOverlayMount'
import { showLoginModal } from '../LoginModal'

vi.mock('@opentrons/react-api-client', () => ({
  useAccessControlEnabledQuery: vi.fn(),
}))

vi.mock('/app/resources/auth', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    useLocalRobotAuthSelf: vi.fn(),
  }
})

vi.mock('../LoginModal', async importOriginal => {
  const actual = await importOriginal<typeof import('../LoginModal')>()
  return {
    ...actual,
    showLoginModal: vi.fn(),
  }
})

const render = (): ReturnType<typeof renderWithProviders>[0] =>
  renderWithProviders(
    <NiceModal.Provider>
      <LoggedOutOverlayMount />
    </NiceModal.Provider>
  )[0]

const mockAccessControlEnabled = (enabled: boolean): void => {
  vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
    data: { data: { accessControlEnabled: enabled } },
    isSuccess: true,
  } as ReturnType<typeof useAccessControlEnabledQuery>)
}

describe('LoggedOutOverlayMount', () => {
  beforeEach(() => {
    mockAccessControlEnabled(true)
    vi.mocked(useLocalRobotAuthSelf).mockReturnValue({
      username: null,
      isLoggedIn: false,
      resetPasswordRequired: false,
      locked: false,
    })
    vi.mocked(showLoginModal).mockResolvedValue({ username: 'alice' })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the logged-out overlay when the user is logged out', () => {
    render()

    expect(
      screen.getByRole('dialog', { name: 'Logged out' })
    ).toBeInTheDocument()
  })

  it('renders the logged-out overlay when the user must reset their password', () => {
    vi.mocked(useLocalRobotAuthSelf).mockReturnValue({
      username: 'alice',
      isLoggedIn: true,
      resetPasswordRequired: true,
      locked: false,
    })

    render()

    expect(
      screen.getByRole('dialog', { name: 'Logged out' })
    ).toBeInTheDocument()
  })

  it('opens the login modal when the overlay is clicked', () => {
    render()

    fireEvent.click(screen.getByRole('dialog', { name: 'Logged out' }))

    expect(showLoginModal).toHaveBeenCalledOnce()
  })

  it('renders nothing when access control is disabled', () => {
    mockAccessControlEnabled(false)

    render()

    expect(
      screen.queryByRole('dialog', { name: 'Logged out' })
    ).not.toBeInTheDocument()
  })
})
