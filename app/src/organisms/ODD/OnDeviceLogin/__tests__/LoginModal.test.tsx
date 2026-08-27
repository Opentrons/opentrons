import '@testing-library/jest-dom/vitest'

import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import NiceModal from '@ebay/nice-modal-react'
import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getUserLoginStatus } from '@opentrons/api-client'

import { i18n } from '/app/i18n'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import { robotAuthReducer } from '/app/redux/robot-auth/slice'
import {
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'

import { showLoginModal } from '../LoginModal'

import type { AuthUser, OAuth2TokenResponse } from '@opentrons/api-client'

vi.mock('@opentrons/api-client', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    getUserLoginStatus: vi.fn(),
  }
})

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useHost: vi.fn(() => ({ hostname: 'localhost', port: 31950 })),
  }
})

vi.mock('/app/redux/discovery', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    getLocalRobot: vi.fn(() => mockConnectableRobot),
  }
})

vi.mock('/app/resources/auth')

const OAUTH_RESPONSE: OAuth2TokenResponse = {
  token_type: 'Bearer',
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
}

function mockAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    username: 'alice',
    fullName: 'Alice',
    accountType: 'user',
    locked: false,
    resetPassword: false,
    ...overrides,
  }
}

function mockUserLoginStatus(resetPassword = false): void {
  vi.mocked(getUserLoginStatus).mockResolvedValue({
    data: { data: { resetPassword } },
  } as Awaited<ReturnType<typeof getUserLoginStatus>>)
}

function mockSuccessfulLogin(): void {
  vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
    submitPassword: (username: string, _password: string) => {
      onSuccess(username, mockAuthUser(), OAUTH_RESPONSE)
    },
    isAuthLoading: false,
  }))

  vi.mocked(useSetNewPasswordAndSignIn).mockImplementation(({ onSuccess }) => ({
    submitNewPassword: (username: string, _password: string) => {
      onSuccess(username)
    },
    isLoading: false,
  }))
}

function setupLoginModalTrigger(): () => ReturnType<typeof showLoginModal> {
  let resultPromise!: ReturnType<typeof showLoginModal>

  const store = configureStore({
    reducer: { robotAuth: robotAuthReducer },
  })

  render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <NiceModal.Provider>
            <button
              type="button"
              onClick={() => {
                resultPromise = showLoginModal()
              }}
            >
              Open login modal
            </button>
          </NiceModal.Provider>
        </Provider>
      </I18nextProvider>
    </QueryClientProvider>
  )

  return () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open login modal' }))
    return resultPromise
  }
}

async function waitForLoginModalOpen(): Promise<void> {
  await waitFor(() => {
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
  })
}

function fillField(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function clickPrimary(name: 'Next' | 'Confirm'): void {
  fireEvent.click(screen.getByRole('button', { name }))
}

async function advanceFromUsername(): Promise<void> {
  fillField('Username', 'alice')
  clickPrimary('Next')
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })
}

describe('LoginModal', () => {
  beforeEach(() => {
    mockUserLoginStatus(false)
    vi.mocked(useOAuth2PasswordLogin).mockReturnValue({
      submitPassword: vi.fn(),
      isAuthLoading: false,
    })
    vi.mocked(useSetNewPasswordAndSignIn).mockReturnValue({
      submitNewPassword: vi.fn(),
      isLoading: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('opens on the username step', async () => {
    const clickOpenLoginModal = setupLoginModalTrigger()
    clickOpenLoginModal()
    await waitForLoginModalOpen()

    expect(screen.getByLabelText('Username')).toBeInTheDocument()
  })

  it('resolves with the username after a successful login', async () => {
    mockSuccessfulLogin()
    const clickOpenLoginModal = setupLoginModalTrigger()
    const resultPromise = clickOpenLoginModal()
    await waitForLoginModalOpen()

    await advanceFromUsername()
    fillField('Password', 'secret123')
    clickPrimary('Confirm')

    await expect(resultPromise).resolves.toEqual({ username: 'alice' })
  })

  it('resolves with null when cancel is clicked', async () => {
    const clickOpenLoginModal = setupLoginModalTrigger()
    const resultPromise = clickOpenLoginModal()
    await waitForLoginModalOpen()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await expect(resultPromise).resolves.toBeNull()
  })

  it('shows an error when OAuth login fails', async () => {
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onError }) => ({
      submitPassword: () => {
        onError('Login failed')
      },
      isAuthLoading: false,
    }))

    const clickOpenLoginModal = setupLoginModalTrigger()
    clickOpenLoginModal()
    await waitForLoginModalOpen()

    await advanceFromUsername()
    fillField('Password', 'wrong')
    clickPrimary('Confirm')

    expect(screen.getByText('Login failed')).toBeInTheDocument()
  })

  it('switches to the new-password flow when first-time login requires a password reset', async () => {
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
      submitPassword: (username: string, _password: string) => {
        onSuccess(
          username,
          mockAuthUser({
            resetPassword: true,
          }),
          OAUTH_RESPONSE
        )
      },
      isAuthLoading: false,
    }))

    const clickOpenLoginModal = setupLoginModalTrigger()
    const resultPromise = clickOpenLoginModal()
    await waitForLoginModalOpen()

    mockUserLoginStatus(true)
    await advanceFromUsername()
    expect(screen.getByLabelText('One-time password')).toBeInTheDocument()
    fillField('One-time password', 'temp-pass')
    clickPrimary('Confirm')

    expect(
      await screen.findByRole('heading', { name: 'New password' })
    ).toBeInTheDocument()

    let modalResolved = false
    void Promise.resolve(resultPromise).then(() => {
      modalResolved = true
    })
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(modalResolved).toBe(false)
  })

  it('switches to the new-password flow when login requires a password reset', async () => {
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
      submitPassword: (username: string, _password: string) => {
        onSuccess(
          username,
          mockAuthUser({ resetPassword: true }),
          OAUTH_RESPONSE
        )
      },
      isAuthLoading: false,
    }))

    const clickOpenLoginModal = setupLoginModalTrigger()
    const resultPromise = clickOpenLoginModal()
    await waitForLoginModalOpen()

    mockUserLoginStatus(true)
    await advanceFromUsername()
    expect(screen.getByLabelText('One-time password')).toBeInTheDocument()
    fillField('One-time password', 'temp-pass')
    clickPrimary('Confirm')

    expect(
      await screen.findByRole('heading', { name: 'New password' })
    ).toBeInTheDocument()

    let modalResolved = false
    void Promise.resolve(resultPromise).then(() => {
      modalResolved = true
    })
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(modalResolved).toBe(false)
  })

  it('returns to login after setting a new password', async () => {
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
      submitPassword: (username: string, _password: string) => {
        onSuccess(
          username,
          mockAuthUser({ resetPassword: true }),
          OAUTH_RESPONSE
        )
      },
      isAuthLoading: false,
    }))
    vi.mocked(useSetNewPasswordAndSignIn).mockImplementation(
      ({ onSuccess }) => ({
        submitNewPassword: (username: string, _password: string) => {
          onSuccess(username)
        },
        isLoading: false,
      })
    )

    const clickOpenLoginModal = setupLoginModalTrigger()
    const resultPromise = clickOpenLoginModal()
    await waitForLoginModalOpen()

    mockUserLoginStatus(true)
    await advanceFromUsername()
    expect(screen.getByLabelText('One-time password')).toBeInTheDocument()
    fillField('One-time password', 'temp-pass')
    clickPrimary('Confirm')

    await screen.findByRole('heading', { name: 'New password' })

    fillField('New password', 'newpass123')
    clickPrimary('Next')
    fillField('Confirm password', 'newpass123')
    clickPrimary('Confirm')

    await waitFor(() => {
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()

    let modalResolved = false
    void Promise.resolve(resultPromise).then(() => {
      modalResolved = true
    })
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(modalResolved).toBe(false)
  })

  it('returns to the new-password step with a policy error when setting a password fails', async () => {
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
      submitPassword: (username: string, _password: string) => {
        onSuccess(
          username,
          mockAuthUser({ resetPassword: true }),
          OAUTH_RESPONSE
        )
      },
      isAuthLoading: false,
    }))
    vi.mocked(useSetNewPasswordAndSignIn).mockImplementation(({ onError }) => ({
      submitNewPassword: () => {
        onError('Must include at least one special character')
      },
      isLoading: false,
    }))

    const clickOpenLoginModal = setupLoginModalTrigger()
    void clickOpenLoginModal()
    await waitForLoginModalOpen()

    mockUserLoginStatus(true)
    await advanceFromUsername()
    expect(screen.getByLabelText('One-time password')).toBeInTheDocument()
    fillField('One-time password', 'temp-pass')
    clickPrimary('Confirm')

    await screen.findByRole('heading', { name: 'New password' })

    fillField('New password', 'newpass123')
    clickPrimary('Next')
    fillField('Confirm password', 'newpass123')
    clickPrimary('Confirm')

    expect(
      await screen.findByText('Must include at least one special character')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('New password')).toBeInTheDocument()
  })
})
