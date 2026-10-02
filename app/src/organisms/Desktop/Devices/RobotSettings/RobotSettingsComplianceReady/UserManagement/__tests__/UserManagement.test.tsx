import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useToaster } from '/app/organisms/ToasterOven'
import { logOut } from '/app/redux/robot-auth'

import { UserManagement } from '..'

import type { RenderResult } from '@testing-library/react'
import type { Store } from 'redux'
import type { AuthUser, AuthUsersResponse } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

vi.mock('../AddUserModal', () => ({
  AddUserModal: ({ onClose }: { onClose: () => void }) => (
    <div>
      <span>mock AddUserModal</span>
      <button type="button" onClick={onClose}>
        Close mock modal
      </button>
    </div>
  ),
}))
vi.mock('../EditUserModal', () => ({
  EditUserModal: ({ onClose }: { onClose: () => void }) => (
    <div>
      <span>mock EditUserModal</span>
      <button type="button" onClick={onClose}>
        Close mock edit modal
      </button>
    </div>
  ),
}))
vi.mock('/app/organisms/ToasterOven')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const ROBOT_NAME = 'flex-1'

const MOCK_AUTH_STATE = {
  user: {
    username: 'alice',
    fullName: 'Alice Example',
    accountType: 'admin' as const,
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: null,
}

const ALICE_USER: AuthUser = {
  username: 'alice',
  fullName: 'Alice Example',
  accountType: 'admin',
  locked: false,
  resetPassword: false,
}

const BOB_USER: AuthUser = {
  username: 'bob',
  fullName: 'Bob Example',
  accountType: 'user',
  locked: true,
  resetPassword: false,
}

const CAROL_USER: AuthUser = {
  username: 'carol',
  fullName: 'Carol Example',
  accountType: 'user',
  locked: false,
  resetPassword: false,
}

const SERVICE_USER: AuthUser = {
  username: 'service',
  fullName: 'Service Account',
  accountType: 'service',
  locked: false,
  resetPassword: false,
}

vi.mock('@opentrons/react-api-client')

const mockOnShowOneTimePassword = vi.fn()
const mockOnEditSelf = vi.fn()

const mockUsers = (users: AuthUser[]): void => {
  const response: AuthUsersResponse = {
    data: users,
    meta: { cursor: 0, totalLength: users.length },
  }
  vi.mocked(useUsersQuery).mockImplementation(
    options =>
      ({
        data: options?.enabled === false ? undefined : response,
      }) as ReturnType<typeof useUsersQuery>
  )
}

const render = (
  initialState: Partial<State> = {}
): [RenderResult, Store<State>] => {
  return renderWithProviders(
    <UserManagement
      robotName={ROBOT_NAME}
      onShowOneTimePassword={mockOnShowOneTimePassword}
      onEditSelf={mockOnEditSelf}
    />,
    {
      i18nInstance: i18n,
      initialState: {
        robotAuth: {
          perRobotAuthStates: {
            [ROBOT_NAME]: MOCK_AUTH_STATE,
          },
          mostRecentRobotName: ROBOT_NAME,
        },
        ...initialState,
      } as State,
    }
  )
}

function expandAccordion(): void {
  fireEvent.click(screen.getByRole('button', { name: 'User management' }))
}

function openOverflowMenu(username: string): void {
  fireEvent.click(
    screen.getByRole('button', {
      name: `UserManagement_overflowMenu_${username}`,
    })
  )
}

const mockDeleteUser = vi.fn()
const mockResetUserPassword = vi.fn()
const mockUpdateUser = vi.fn()

describe('UserManagement', () => {
  beforeEach(() => {
    mockOnShowOneTimePassword.mockReset()
    mockOnEditSelf.mockReset()
    mockDeleteUser.mockReset()
    mockDeleteUser.mockResolvedValue(undefined)
    mockResetUserPassword.mockReset()
    mockResetUserPassword.mockResolvedValue(undefined)
    mockUpdateUser.mockReset()
    mockUpdateUser.mockResolvedValue(undefined)
    vi.mocked(useToaster).mockReturnValue({
      makeToast: vi.fn(),
      eatToast: vi.fn(),
      makeSnackbar: vi.fn(),
    })
    vi.mocked(useDeleteUserMutation).mockReturnValue({
      deleteUser: mockDeleteUser,
    } as any)
    vi.mocked(useResetUserPasswordMutation).mockReturnValue({
      resetUserPassword: mockResetUserPassword,
      isLoading: false,
    } as any)
    vi.mocked(useUpdateUserMutation).mockReturnValue({
      updateUser: mockUpdateUser,
      isLoading: false,
    } as any)
    mockUsers([ALICE_USER, BOB_USER])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the user management accordion', () => {
    render()
    screen.getByRole('button', { name: 'User management' })
  })

  it('renders users from useUsersQuery when expanded and logged in', () => {
    render()
    expandAccordion()

    screen.getByText('Username')
    screen.getByText('Legal name')
    screen.getByText('Role')
    screen.getByText('Status')
    screen.getByText('alice')
    screen.getByText('Alice Example')
    screen.getByText('Admin')
    screen.getByText('Active')
    screen.getByText('bob')
    screen.getByText('Bob Example')
    screen.getByText('User')
    screen.getByText('Locked')
  })

  it('does not fetch users when logged out', () => {
    render({
      robotAuth: {
        perRobotAuthStates: {},
        mostRecentRobotName: null,
      },
    })

    expect(useUsersQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false })
    )
    expandAccordion()
    expect(screen.queryByText('alice')).not.toBeInTheDocument()
  })

  it('opens the add user modal when Add user is clicked', () => {
    render()
    expandAccordion()
    fireEvent.click(screen.getByRole('button', { name: 'Add user' }))
    screen.getByText('mock AddUserModal')
  })

  it('opens the edit user modal when Edit user is selected for another user', () => {
    render()
    expandAccordion()
    openOverflowMenu('bob')
    fireEvent.click(screen.getByRole('button', { name: 'Edit user' }))
    screen.getByText('mock EditUserModal')
    expect(mockOnEditSelf).not.toHaveBeenCalled()
  })

  it('calls onEditSelf instead of opening the edit modal for the logged-in user', () => {
    render()
    expandAccordion()
    openOverflowMenu('alice')
    fireEvent.click(screen.getByRole('button', { name: 'Edit user' }))
    expect(mockOnEditSelf).toHaveBeenCalledOnce()
    expect(screen.queryByText('mock EditUserModal')).not.toBeInTheDocument()
  })

  it('only offers Edit user in the overflow menu for the logged-in user', () => {
    render()
    expandAccordion()
    openOverflowMenu('alice')

    screen.getByRole('button', { name: 'Edit user' })
    expect(
      screen.queryByRole('button', { name: 'Delete user' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Reset password' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Lock account' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: 'Unlock account and reset password',
      })
    ).not.toBeInTheDocument()
  })

  it('opens the delete user confirm modal when Delete user is selected from the overflow menu', () => {
    render()
    expandAccordion()
    openOverflowMenu('bob')
    fireEvent.click(screen.getByRole('button', { name: 'Delete user' }))
    screen.getByText('Delete this account?')
  })

  it('does not log out when deleting another user account', async () => {
    mockUsers([ALICE_USER, CAROL_USER])
    const [, store] = render()
    expandAccordion()
    openOverflowMenu('carol')
    fireEvent.click(screen.getByRole('button', { name: 'Delete user' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await vi.waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith('carol')
    })
    expect(store.dispatch).not.toHaveBeenCalledWith(
      logOut({ robotName: ROBOT_NAME })
    )
  })

  it('opens the reset password confirm modal when Reset password is selected from the overflow menu', () => {
    mockUsers([ALICE_USER, CAROL_USER])
    render()
    expandAccordion()
    openOverflowMenu('carol')
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))
    screen.getByText("Reset this user's password?")
  })

  it('shows the one-time password and does not log out when resetting another user password', async () => {
    mockResetUserPassword.mockResolvedValue({
      data: { temporaryPassword: 'temp-password-456' },
    })
    mockUsers([ALICE_USER, CAROL_USER])
    const [, store] = render()
    expandAccordion()
    openOverflowMenu('carol')
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    await vi.waitFor(() => {
      expect(mockResetUserPassword).toHaveBeenCalledWith('carol')
      expect(mockOnShowOneTimePassword).toHaveBeenCalledWith(
        'temp-password-456'
      )
    })
    expect(store.dispatch).not.toHaveBeenCalledWith(
      logOut({ robotName: ROBOT_NAME })
    )
  })

  it('shows Unlock in the overflow menu only for locked users', () => {
    mockUsers([ALICE_USER, BOB_USER, CAROL_USER])
    render()
    expandAccordion()
    openOverflowMenu('carol')
    expect(
      screen.queryByRole('button', {
        name: 'Unlock account and reset password',
      })
    ).not.toBeInTheDocument()
    openOverflowMenu('carol')
    openOverflowMenu('bob')
    screen.getByRole('button', { name: 'Unlock account and reset password' })
  })

  it('opens the activate modal with unlock and cancel actions', () => {
    render()
    expandAccordion()
    openOverflowMenu('bob')
    fireEvent.click(
      screen.getByRole('button', { name: 'Unlock account and reset password' })
    )
    screen.getByText('Activate this account?')
    expect(
      screen.getAllByRole('button', {
        name: 'Unlock account and reset password',
      })
    ).toHaveLength(1)
    screen.getByRole('button', { name: 'Cancel' })
  })

  it('shows Lock account only for active users in the overflow menu', () => {
    mockUsers([ALICE_USER, BOB_USER, CAROL_USER])
    render()
    expandAccordion()
    openOverflowMenu('carol')
    screen.getByRole('button', { name: 'Lock account' })
    openOverflowMenu('carol')
    openOverflowMenu('bob')
    expect(
      screen.queryByRole('button', { name: 'Lock account' })
    ).not.toBeInTheDocument()
  })

  it('opens the lock confirm modal when Lock account is selected', () => {
    mockUsers([ALICE_USER, CAROL_USER])
    render()
    expandAccordion()
    openOverflowMenu('carol')
    fireEvent.click(screen.getByRole('button', { name: 'Lock account' }))
    screen.getByText('Lock this account?')
  })

  it('does not log out when locking another user account', async () => {
    mockUsers([ALICE_USER, CAROL_USER])
    const [, store] = render()
    expandAccordion()
    openOverflowMenu('carol')
    fireEvent.click(screen.getByRole('button', { name: 'Lock account' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lock account' }))

    await vi.waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        username: 'carol',
        request: { data: { locked: true } },
      })
    })
    expect(store.dispatch).not.toHaveBeenCalledWith(
      logOut({ robotName: ROBOT_NAME })
    )
  })

  it('unlocks and resets password when confirmed in the activate modal', async () => {
    mockResetUserPassword.mockResolvedValue({
      data: { temporaryPassword: 'temp-password-123' },
    })
    render()
    expandAccordion()
    openOverflowMenu('bob')
    fireEvent.click(
      screen.getByRole('button', { name: 'Unlock account and reset password' })
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Unlock account and reset password' })
    )

    await vi.waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        username: 'bob',
        request: { data: { locked: false } },
      })
      expect(mockResetUserPassword).toHaveBeenCalledWith('bob')
      expect(mockOnShowOneTimePassword).toHaveBeenCalledWith(
        'temp-password-123'
      )
    })
    expect(mockUpdateUser).toHaveBeenCalledTimes(1)
    expect(mockResetUserPassword).toHaveBeenCalledTimes(1)
    expect(mockUpdateUser.mock.invocationCallOrder[0]).toBeLessThan(
      mockResetUserPassword.mock.invocationCallOrder[0]!
    )
  })

  it('only allows reset password for a service account', () => {
    mockUsers([ALICE_USER, BOB_USER, SERVICE_USER])
    render()
    expandAccordion()
    openOverflowMenu('service')

    screen.getByRole('button', { name: 'Reset password' })
    expect(
      screen.queryByRole('button', { name: 'Edit user' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Delete user' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Lock account' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: 'Unlock account and reset password',
      })
    ).not.toBeInTheDocument()
  })
})
