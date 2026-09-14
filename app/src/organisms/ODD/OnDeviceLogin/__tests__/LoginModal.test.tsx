import '@testing-library/jest-dom/vitest'

import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import NiceModal from '@ebay/nice-modal-react'
import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import { robotAuthReducer } from '/app/redux/robot-auth/slice'
import {
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'

import { showLoginModal } from '../LoginModal'

import type { AuthUser, OAuth2TokenResponse } from '@opentrons/api-client'

vi.mock('/app/redux/discovery', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    getLocalRobot: vi.fn(() => mockConnectableRobot),
  }
})

vi.mock('/app/resources/auth')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

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

function mockSuccessfulLogin(): void {
  vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
    submitPassword: (username: string, _password: string) => {
      onSuccess(username, mockAuthUser(), OAUTH_RESPONSE)
    },
    isAuthLoading: false,
  }))

  vi.mocked(useSetNewPasswordAndSignIn).mockImplementation(
    (_documentationState, { onSuccess }) => ({
      submitNewPassword: (username: string, password: string) => {
        onSuccess(username, password)
      },
      isLoading: false,
    })
  )
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

describe('LoginModal', () => {
  beforeEach(() => {
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

    fillField('Username', 'alice')
    clickPrimary('Next')
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

    fillField('Username', 'alice')
    clickPrimary('Next')
    fillField('Password', 'wrong')
    clickPrimary('Confirm')

    expect(screen.getByText('Login failed')).toBeInTheDocument()
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

    fillField('Username', 'alice')
    clickPrimary('Next')
    fillField('Password', 'temp-pass')
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

  it('signs in after setting a new password', async () => {
    let loginCallCount = 0
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
      submitPassword: (username: string, _password: string) => {
        loginCallCount += 1
        onSuccess(
          username,
          mockAuthUser({ resetPassword: loginCallCount === 1 }),
          OAUTH_RESPONSE
        )
      },
      isAuthLoading: false,
    }))
    vi.mocked(useSetNewPasswordAndSignIn).mockImplementation(
      (_documentationState, { onSuccess }) => ({
        submitNewPassword: (username: string, password: string) => {
          onSuccess(username, password)
        },
        isLoading: false,
      })
    )

    const clickOpenLoginModal = setupLoginModalTrigger()
    const resultPromise = clickOpenLoginModal()
    await waitForLoginModalOpen()

    fillField('Username', 'alice')
    clickPrimary('Next')
    fillField('Password', 'temp-pass')
    clickPrimary('Confirm')

    await screen.findByRole('heading', { name: 'New password' })

    fillField('New password', 'newpass123')
    clickPrimary('Next')
    fillField('Confirm password', 'newpass123')
    clickPrimary('Confirm')

    expect(await screen.findByText('Password updated')).toBeInTheDocument()
    await expect(resultPromise).resolves.toEqual({ username: 'alice' })
  }, 10000)

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
    vi.mocked(useSetNewPasswordAndSignIn).mockImplementation(
      (_documentationState, { onError }) => ({
        submitNewPassword: () => {
          onError('Must include at least one special character')
        },
        isLoading: false,
      })
    )

    const clickOpenLoginModal = setupLoginModalTrigger()
    void clickOpenLoginModal()
    await waitForLoginModalOpen()

    fillField('Username', 'alice')
    clickPrimary('Next')
    fillField('Password', 'temp-pass')
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
