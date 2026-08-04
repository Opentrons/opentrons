import '@testing-library/jest-dom/vitest'

import { fireEvent, screen, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useUsersQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
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

describe('UserManagement', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.mocked(useToaster).mockReturnValue({
      makeToast: vi.fn(),
      eatToast: vi.fn(),
      makeSnackbar: vi.fn(),
    })
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
})
