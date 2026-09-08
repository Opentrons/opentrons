import '@testing-library/jest-dom/vitest'

import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUpdateSelfMutation } from '@opentrons/react-api-client'

import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { robotAuthReducer } from '/app/redux/robot-auth'

import { PersonalAccountSettings } from '..'

import type { RenderResult } from '@testing-library/react'
import type { AuthUserResponse, UpdateSelfRequest } from '@opentrons/api-client'
import type { RobotAuthState } from '/app/redux/robot-auth/slice'

const ROBOT_NAME = 'flex-1'

const MOCK_AUTH_STATE = {
  user: {
    username: 'alice',
    fullName: 'Alice Example',
    accountType: 'user' as const,
  },
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
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const mockUpdateSelf = vi.fn()

const renderComponent = (robotAuth?: RobotAuthState): RenderResult => {
  const store = configureStore({
    reducer: { robotAuth: robotAuthReducer },
    preloadedState: {
      robotAuth: robotAuth ?? {
        perRobotAuthStates: {
          [ROBOT_NAME]: MOCK_AUTH_STATE,
        },
        mostRecentRobotName: ROBOT_NAME,
      },
    },
  })

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <PersonalAccountSettings robotName={ROBOT_NAME} />
        </Provider>
      </I18nextProvider>
    </QueryClientProvider>
  )
}

function openEditForm(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
}

function getPasswordInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('input')).filter(
    (input): input is HTMLInputElement => input.type === 'password'
  )
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
    mockUpdateSelf.mockReset()
    mockUpdateSelf.mockImplementation(async (request: UpdateSelfRequest) => {
      return {
        data: {
          ...MOCK_SELF_RESPONSE.data,
          ...(request.data.username != null
            ? { username: request.data.username }
            : {}),
          ...(request.data.fullName != null
            ? { fullName: request.data.fullName }
            : {}),
        },
      } satisfies AuthUserResponse
    })
    vi.mocked(useUpdateSelfMutation).mockReturnValue({
      updateSelf: mockUpdateSelf,
      isLoading: false,
    } as any)
  })

  it('renders view mode and toggles between view and edit', () => {
    renderComponent()
    screen.getByText('Personal account settings')
    screen.getByText('alice')
    screen.getByText('Alice Example')
    screen.getByText('************************')
    screen.getByRole('button', { name: 'Edit' })

    openEditForm()
    expect(screen.getByDisplayValue('alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice Example')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: 'Edit' })
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Save' })
    ).not.toBeInTheDocument()
  })

  it('shows the logged out message when the user is not logged in', () => {
    renderComponent({
      perRobotAuthStates: {},
      mostRecentRobotName: null,
    })
    screen.getByTestId('InfoScreen')
    screen.getByLabelText('alert')
    screen.getByText('Log in to manage Compliance Ready Software settings')
    expect(
      screen.queryByText('Personal account settings')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Edit' })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('alice')).not.toBeInTheDocument()
  })

  it('shows the logged out message after the session expires', () => {
    const store = configureStore({
      reducer: { robotAuth: robotAuthReducer },
      preloadedState: {
        robotAuth: {
          perRobotAuthStates: {
            [ROBOT_NAME]: MOCK_AUTH_STATE,
          },
          mostRecentRobotName: ROBOT_NAME,
        },
      },
    })

    const { rerender } = render(
      <QueryClientProvider client={new QueryClient()}>
        <I18nextProvider i18n={i18n}>
          <Provider store={store}>
            <PersonalAccountSettings robotName={ROBOT_NAME} />
          </Provider>
        </I18nextProvider>
      </QueryClientProvider>
    )

    screen.getByText('alice')

    store.dispatch({
      type: 'robotAuth/timeOutLogin',
      payload: { robotName: ROBOT_NAME },
    })

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <I18nextProvider i18n={i18n}>
          <Provider store={store}>
            <PersonalAccountSettings robotName={ROBOT_NAME} />
          </Provider>
        </I18nextProvider>
      </QueryClientProvider>
    )

    screen.getByTestId('InfoScreen')
    screen.getByLabelText('alert')
    screen.getByText('Log in to manage Compliance Ready Software settings')
    expect(screen.queryByText('alice')).not.toBeInTheDocument()
  })

  it('calls updateSelf and returns to view mode with updated fields on successful save', async () => {
    renderComponent()
    openEditForm()
    fireEvent.change(screen.getByDisplayValue('Alice Example'), {
      target: { value: 'Alice Updated' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

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
      screen.queryByRole('button', { name: 'Save' })
    ).not.toBeInTheDocument()
  })

  it.each<{
    description: string
    applyChange: (container: HTMLElement) => void
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
      applyChange: container => {
        getPasswordInputs(container).forEach(input => {
          fireEvent.change(input, { target: { value: 'new-password' } })
        })
      },
      expectedData: { password: 'new-password' },
    },
  ])(
    'calls updateSelf with $description when password fields are otherwise empty',
    async ({ applyChange, expectedData }) => {
      const { container } = renderComponent()
      openEditForm()
      applyChange(container)
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(mockUpdateSelf).toHaveBeenCalledWith({ data: expectedData })
      })
    }
  )

  it('shows a save error when updateSelf fails', async () => {
    mockUpdateSelf.mockRejectedValue(new Error('save failed'))
    renderComponent()
    openEditForm()
    fireEvent.change(screen.getByDisplayValue('alice'), {
      target: { value: 'alice2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      screen.getByText('Unable to save account settings. Try again.')
    })
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('shows a username error when updateSelf returns username already exists', async () => {
    mockUpdateSelf.mockRejectedValue(createUsernameExistsError())
    renderComponent()
    openEditForm()
    fireEvent.change(screen.getByDisplayValue('alice'), {
      target: { value: 'bob' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      screen.getByText(
        'This username is already taken. Choose a different username.'
      )
    })
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(
      screen.queryByText('Unable to save account settings. Try again.')
    ).not.toBeInTheDocument()
  })

  it('keeps username and legal name read-only for a service account', async () => {
    const { container } = renderComponent({
      perRobotAuthStates: {
        [ROBOT_NAME]: {
          ...MOCK_AUTH_STATE,
          user: {
            username: 'service',
            fullName: 'Service Account',
            accountType: 'service',
          },
        },
      },
      mostRecentRobotName: ROBOT_NAME,
    })

    openEditForm()
    expect(screen.getByDisplayValue('service')).toHaveAttribute('readOnly')
    expect(screen.getByDisplayValue('Service Account')).toHaveAttribute(
      'readOnly'
    )

    getPasswordInputs(container).forEach(input => {
      fireEvent.change(input, { target: { value: 'new-password' } })
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockUpdateSelf).toHaveBeenCalledWith({
        data: { password: 'new-password' },
      })
    })
  })
})
