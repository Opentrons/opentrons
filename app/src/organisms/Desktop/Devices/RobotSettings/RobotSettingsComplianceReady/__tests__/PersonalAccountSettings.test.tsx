import '@testing-library/jest-dom/vitest'

import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useHost,
  useSelfQuery,
  useUpdateSelfMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { PersonalAccountSettings } from '../PersonalAccountSettings'

import type { RenderResult } from '@testing-library/react'
import type { AuthUserResponse, UpdateSelfRequest } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

const ROBOT_NAME = 'flex-1'

const MOCK_AUTH_STATE = {
  username: 'alice',
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: null,
}

const MOCK_SELF_RESPONSE = {
  data: {
    username: 'alice',
    fullName: 'Alice Example',
    accountType: 'user' as const,
    scopes: [],
    locked: false,
    resetPassword: false,
  },
} as AuthUserResponse

vi.mock('@opentrons/react-api-client')

const mockUpdateSelf = vi.fn()
let selfResponse = MOCK_SELF_RESPONSE

const render = (initialState: Partial<State> = {}): RenderResult => {
  return renderWithProviders(
    <PersonalAccountSettings robotName={ROBOT_NAME} />,
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
  )[0]
}

function openEditForm(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
}

function createUsernameExistsError(): any {
  return {
    isAxiosError: true,
    message: 'Request failed',
    name: 'AxiosError',
    response: {
      status: 400,
      data: {
        errors: [{ id: 'userAlreadyExists' }],
      },
      statusText: 'Bad Request',
      headers: {},
      config: {},
    },
  } as any
}

describe('PersonalAccountSettings', () => {
  beforeEach(() => {
    selfResponse = MOCK_SELF_RESPONSE
    mockUpdateSelf.mockReset()
    mockUpdateSelf.mockImplementation(async (request: UpdateSelfRequest) => {
      selfResponse = {
        data: {
          ...selfResponse.data,
          ...(request.data.username != null
            ? { username: request.data.username }
            : {}),
          ...(request.data.fullName != null
            ? { fullName: request.data.fullName }
            : {}),
        },
      }
      return selfResponse
    })
    vi.mocked(useHost).mockReturnValue({
      hostname: '10.0.0.1',
      port: 31950,
    } as ReturnType<typeof useHost>)
    vi.mocked(useSelfQuery).mockImplementation(
      options =>
        ({
          data: options?.enabled === false ? undefined : selfResponse,
        }) as ReturnType<typeof useSelfQuery>
    )
    vi.mocked(useUpdateSelfMutation).mockReturnValue({
      updateSelf: mockUpdateSelf,
      isLoading: false,
    } as any)
  })

  it('renders view mode and toggles between view and edit', () => {
    render()
    screen.getByText('Personal account settings')
    screen.getByText('alice')
    screen.getByText('Alice Example')
    screen.getByText('************************')
    screen.getByRole('button', { name: 'Edit' })

    openEditForm()
    expect(screen.getByDisplayValue('alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice Example')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled()

    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[1]!)
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'save' })
    ).not.toBeInTheDocument()
  })

  it('does not show the edit button when the user is not logged in', () => {
    render({
      robotAuth: {
        perRobotAuthStates: {},
        mostRecentRobotName: null,
      },
    })
    screen.getByText('Personal account settings')
    expect(
      screen.queryByRole('button', { name: 'Edit' })
    ).not.toBeInTheDocument()
  })

  it('calls updateSelf and returns to view mode with updated fields on successful save', async () => {
    render()
    openEditForm()
    fireEvent.change(screen.getByDisplayValue('Alice Example'), {
      target: { value: 'Alice Updated' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'save' }))

    await waitFor(() => {
      expect(mockUpdateSelf).toHaveBeenCalledOnce()
    })
    const updateData = mockUpdateSelf.mock.calls[0][0].data
    expect(updateData).toEqual({ fullName: 'Alice Updated' })
    expect(updateData).not.toHaveProperty('username')
    expect(updateData).not.toHaveProperty('password')
    await waitFor(() => {
      screen.getByText('Alice Updated')
    })
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'save' })
    ).not.toBeInTheDocument()
  })

  it.each<{
    description: string
    applyChange: () => void
    expectedData: { username?: string; password?: string }
  }>([
    {
      description: 'username only',
      applyChange: () => {
        fireEvent.change(screen.getByDisplayValue('alice'), {
          target: { value: 'alice2' },
        })
      },
      expectedData: { username: 'alice2' },
    },
    {
      description: 'password only',
      applyChange: () => {
        screen
          .getAllByPlaceholderText('************************')
          .forEach(input => {
            fireEvent.change(input, { target: { value: 'new-password' } })
          })
      },
      expectedData: { password: 'new-password' },
    },
  ])(
    'calls updateSelf with $description when password fields are otherwise empty',
    async ({ applyChange, expectedData }) => {
      render()
      openEditForm()
      applyChange()
      fireEvent.click(screen.getByRole('button', { name: 'save' }))

      await waitFor(() => {
        expect(mockUpdateSelf).toHaveBeenCalledWith({ data: expectedData })
      })
    }
  )

  it('shows a save error when updateSelf fails', async () => {
    mockUpdateSelf.mockRejectedValue(new Error('save failed'))
    render()
    openEditForm()
    fireEvent.change(screen.getByDisplayValue('alice'), {
      target: { value: 'alice2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'save' }))

    await waitFor(() => {
      screen.getByText('Unable to save account settings. Try again.')
    })
    expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument()
  })

  it('shows a username error when updateSelf returns username already exists', async () => {
    mockUpdateSelf.mockRejectedValue(createUsernameExistsError())
    render()
    openEditForm()
    fireEvent.change(screen.getByDisplayValue('alice'), {
      target: { value: 'bob' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'save' }))

    await waitFor(() => {
      screen.getByText(
        'This username is already taken. Choose a different username.'
      )
    })
    expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument()
    expect(
      screen.queryByText('Unable to save account settings. Try again.')
    ).not.toBeInTheDocument()
  })
})
