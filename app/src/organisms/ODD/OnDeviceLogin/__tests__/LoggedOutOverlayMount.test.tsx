import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAccessControlEnabledQuery,
  useSelfQuery,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { getIsLoggedInToLocalRobot } from '/app/redux/robot-auth'

import { LoggedOutOverlayMount } from '../LoggedOutOverlayMount'
import { showLoginModal, useIsLoginModalOpen } from '../LoginModal'

import type * as ReactRedux from 'react-redux'
import type * as RobotAuth from '/app/redux/robot-auth'

vi.mock('@opentrons/react-api-client', () => ({
  useAccessControlEnabledQuery: vi.fn(),
  useSelfQuery: vi.fn(),
}))

vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal<typeof RobotAuth>()
  return {
    ...actual,
    getIsLoggedInToLocalRobot: vi.fn(),
  }
})

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof ReactRedux>()
  return {
    ...actual,
    useSelector: vi.fn((selector: (state: unknown) => unknown) => selector({})),
  }
})

vi.mock('../LoginModal', () => ({
  showLoginModal: vi.fn(),
  useIsLoginModalOpen: vi.fn(() => false),
}))

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
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(false)
    vi.mocked(useSelfQuery).mockReturnValue({
      data: { data: { resetPassword: false } },
    } as ReturnType<typeof useSelfQuery>)
    vi.mocked(useIsLoginModalOpen).mockReturnValue(false)
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
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(true)
    vi.mocked(useSelfQuery).mockReturnValue({
      data: { data: { resetPassword: true } },
    } as ReturnType<typeof useSelfQuery>)

    render()

    expect(
      screen.getByRole('dialog', { name: 'Logged out' })
    ).toBeInTheDocument()
  })

  it('opens the login modal when the overlay is clicked', () => {
    render()

    fireEvent.click(screen.getByRole('dialog', { name: 'Logged out' }))

    expect(showLoginModal).toHaveBeenCalled()
  })

  it('renders nothing when access control is disabled', () => {
    mockAccessControlEnabled(false)

    render()

    expect(
      screen.queryByRole('dialog', { name: 'Logged out' })
    ).not.toBeInTheDocument()
  })
})
