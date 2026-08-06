import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  useUsersQuery,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useToaster } from '/app/organisms/ToasterOven'

import { UserManagement } from '../UserManagement'

import type { RenderResult } from '@testing-library/react'
import type { AuthUsersResponse } from '@opentrons/api-client'
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

const MOCK_USERS_RESPONSE: AuthUsersResponse = {
  data: [
    {
      username: 'alice',
      fullName: 'Alice Example',
      accountType: 'admin',
      locked: false,
      resetPassword: false,
    },
    {
      username: 'bob',
      fullName: 'Bob Example',
      accountType: 'user',
      locked: true,
      resetPassword: false,
    },
  ],
  meta: {
    cursor: 0,
    totalLength: 2,
  },
}

vi.mock('@opentrons/react-api-client')

const render = (initialState: Partial<State> = {}): RenderResult => {
  return renderWithProviders(<UserManagement robotName={ROBOT_NAME} />, {
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
  })[0]
}

function expandAccordion(): void {
  fireEvent.click(screen.getByRole('button', { name: 'User management' }))
}

const mockDeleteUser = vi.fn()
const mockResetUserPassword = vi.fn()

describe('UserManagement', () => {
  beforeEach(() => {
    mockDeleteUser.mockReset()
    mockDeleteUser.mockResolvedValue(undefined)
    mockResetUserPassword.mockReset()
    mockResetUserPassword.mockResolvedValue(undefined)
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
    vi.mocked(useUsersQuery).mockImplementation(
      options =>
        ({
          data: options?.enabled === false ? undefined : MOCK_USERS_RESPONSE,
        }) as ReturnType<typeof useUsersQuery>
    )
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

    expect(useUsersQuery).toHaveBeenCalledWith({ enabled: false })
    expandAccordion()
    expect(screen.queryByText('alice')).not.toBeInTheDocument()
  })

  it('opens the add user modal when Add User is clicked', () => {
    render()
    expandAccordion()
    fireEvent.click(screen.getByRole('button', { name: 'Add User' }))
    screen.getByText('mock AddUserModal')
  })

  it('opens the edit user modal when Edit user is selected from the overflow menu', () => {
    render()
    expandAccordion()
    fireEvent.click(
      screen.getByRole('button', { name: 'UserManagement_overflowMenu_alice' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Edit user' }))
    screen.getByText('mock EditUserModal')
  })

  it('opens the delete user confirm modal when Delete user is selected from the overflow menu', () => {
    render()
    expandAccordion()
    fireEvent.click(
      screen.getByRole('button', { name: 'UserManagement_overflowMenu_alice' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete user' }))
    screen.getByText('Delete this account?')
  })

  it('opens the reset password confirm modal when Reset password is selected from the overflow menu', () => {
    render()
    expandAccordion()
    fireEvent.click(
      screen.getByRole('button', { name: 'UserManagement_overflowMenu_alice' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))
    screen.getByText("Reset this user's password?")
  })

  it('shows Unlock in the overflow menu for all users', () => {
    render()
    expandAccordion()
    fireEvent.click(
      screen.getByRole('button', { name: 'UserManagement_overflowMenu_alice' })
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'UserManagement_overflowMenu_bob' })
    )
    expect(
      screen.getAllByRole('button', {
        name: 'Unlock account and reset password',
      })
    ).toHaveLength(2)
  })

  it('opens the activate modal with unlock and cancel actions', () => {
    render()
    expandAccordion()
    fireEvent.click(
      screen.getByRole('button', { name: 'UserManagement_overflowMenu_bob' })
    )
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

  it('unlocks and resets password when confirmed in the activate modal', async () => {
    mockResetUserPassword.mockResolvedValue({
      data: { temporaryPassword: 'temp-password-123' },
    })
    render()
    expandAccordion()
    fireEvent.click(
      screen.getByRole('button', { name: 'UserManagement_overflowMenu_bob' })
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Unlock account and reset password' })
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Unlock account and reset password' })
    )

    await vi.waitFor(() => {
      expect(mockResetUserPassword).toHaveBeenCalledWith('bob')
      screen.getByText('temp-password-123')
    })
    expect(mockResetUserPassword).toHaveBeenCalledTimes(1)
  })
})
