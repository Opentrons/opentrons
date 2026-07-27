import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUsersQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { UserManagement } from '../UserManagement'

import type { RenderResult } from '@testing-library/react'
import type { AuthUsersResponse } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

const ROBOT_NAME = 'flex-1'

const MOCK_AUTH_STATE = {
  username: 'alice',
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
  beforeEach(() => {
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
})
