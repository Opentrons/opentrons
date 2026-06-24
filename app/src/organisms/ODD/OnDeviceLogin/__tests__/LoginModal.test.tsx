import { QueryClient } from 'react-query'
import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'

import { showLoginModal } from '../LoginModal'

import type {
  AuthUser,
  HostConfig,
  OAuth2TokenResponse,
} from '@opentrons/api-client'

vi.mock('../clearStaleAuthBeforeLogin', () => ({
  clearStaleAuthBeforeLogin: () => Promise.resolve(),
}))

vi.mock('/app/redux/discovery', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    getLocalRobot: vi.fn(() => null),
  }
})

vi.mock('/app/resources/access-control/useStoreLoginState')
vi.mock('/app/resources/auth')

const QUERY_CLIENT = new QueryClient()
const HOST_CONFIG: HostConfig = {
  hostname: 'localhost',
  token: 'access-token',
}

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
    scopes: [],
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

  vi.mocked(useSetNewPasswordAndSignIn).mockImplementation(({ onSuccess }) => ({
    submitNewPassword: (username: string, _password: string) => {
      onSuccess(username, OAUTH_RESPONSE)
    },
    isLoading: false,
  }))
}

function setupLoginModalTrigger(): () => ReturnType<typeof showLoginModal> {
  let resultPromise!: ReturnType<typeof showLoginModal>

  renderWithProviders(
    <NiceModal.Provider>
      <button
        type="button"
        onClick={() => {
          resultPromise = showLoginModal(QUERY_CLIENT, HOST_CONFIG)
        }}
      >
        Open login modal
      </button>
    </NiceModal.Provider>,
    { i18nInstance: i18n }
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
    vi.mocked(useStoreLoginState).mockReturnValue(vi.fn())
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

  it('completes the new-password flow and resolves the modal', async () => {
    mockSuccessfulLogin()
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

    await screen.findByRole('heading', { name: 'New password' })

    fillField('New password', 'newpass123')
    clickPrimary('Next')
    fillField('Confirm password', 'newpass123')
    clickPrimary('Confirm')

    await expect(resultPromise).resolves.toEqual({ username: 'alice' })
  })
})
