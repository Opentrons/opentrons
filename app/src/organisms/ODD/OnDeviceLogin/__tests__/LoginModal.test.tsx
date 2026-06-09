import { QueryClient } from 'react-query'
import NiceModal from '@ebay/nice-modal-react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useHost } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { useToaster } from '/app/organisms/ToasterOven'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'

import { clearStaleAuthBeforeLogin } from '../clearStaleAuthBeforeLogin'
import { showLoginModal } from '../LoginModal'

import type * as ReactI18next from 'react-i18next'
import type {
  AuthUser,
  HostConfig,
  OAuth2TokenResponse,
} from '@opentrons/api-client'

const QUERY_CLIENT = new QueryClient()
const HOST_CONFIG: HostConfig = {
  hostname: 'localhost',
  token: 'access-token',
}

vi.mock('react-i18next', async importOriginal => {
  const actual = await importOriginal<typeof ReactI18next>()
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  }
})

vi.mock('/app/redux/discovery', () => ({
  getLocalRobot: vi.fn(() => null),
}))

vi.mock('../clearStaleAuthBeforeLogin', () => ({
  clearStaleAuthBeforeLogin: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('/app/resources/auth', () => ({
  useOAuth2PasswordLogin: vi.fn(),
  useSetNewPasswordAndSignIn: vi.fn(),
}))

vi.mock('/app/resources/access-control/useStoreLoginState', () => ({
  useStoreLoginState: vi.fn(),
}))

vi.mock('/app/organisms/ToasterOven', () => ({
  useToaster: vi.fn(),
}))

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useHost: vi.fn(),
  }
})

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

async function openLoginModal(): Promise<ReturnType<typeof showLoginModal>> {
  renderWithProviders(
    <NiceModal.Provider>
      <div />
    </NiceModal.Provider>
  )

  let resultPromise!: ReturnType<typeof showLoginModal>
  act(() => {
    resultPromise = showLoginModal(QUERY_CLIENT, HOST_CONFIG)
  })

  await waitFor(() => {
    expect(
      screen.getByLabelText('device_settings:username')
    ).toBeInTheDocument()
  })

  return resultPromise
}

describe('LoginModal', () => {
  const mockStoreLoginState = vi.fn()

  beforeEach(() => {
    vi.mocked(useHost).mockReturnValue({
      hostname: 'localhost',
      token: 'access-token',
    })
    vi.mocked(useToaster).mockReturnValue({
      makeSnackbar: vi.fn(),
      makeToast: vi.fn(),
      eatToast: vi.fn(),
    })
    vi.mocked(useStoreLoginState).mockReturnValue(mockStoreLoginState)

    vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
      submitPassword: (username: string, _password: string) => {
        onSuccess(username, mockAuthUser(), OAUTH_RESPONSE)
      },
      isAuthLoading: false,
    }))

    vi.mocked(useSetNewPasswordAndSignIn).mockImplementation(
      ({ onSuccess }) => ({
        submitNewPassword: (username: string, _password: string) => {
          onSuccess(username, OAUTH_RESPONSE)
        },
        isLoading: false,
      })
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const fillField = (label: string, value: string): void => {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  }

  const clickPrimary = (name: 'next' | 'confirm'): void => {
    fireEvent.click(screen.getByRole('button', { name }))
  }

  it('clears stale auth before opening the modal', async () => {
    await openLoginModal()

    expect(clearStaleAuthBeforeLogin).toHaveBeenCalledWith(
      QUERY_CLIENT,
      HOST_CONFIG
    )
  })

  it('opens on the username step', async () => {
    await openLoginModal()

    expect(
      screen.getByLabelText('device_settings:username')
    ).toBeInTheDocument()
  })

  it('resolves with the username after a successful login', async () => {
    const resultPromise = await openLoginModal()

    fillField('device_settings:username', 'alice')
    clickPrimary('next')
    fillField('device_settings:password', 'secret123')
    clickPrimary('confirm')

    await expect(resultPromise).resolves.toEqual({ username: 'alice' })
    expect(mockStoreLoginState).toHaveBeenCalledWith('alice', OAUTH_RESPONSE)
  })

  it('resolves with null when cancel is clicked', async () => {
    const resultPromise = await openLoginModal()

    fireEvent.click(screen.getByTestId('ChildNavigation_Secondary_Button'))

    await expect(resultPromise).resolves.toBeNull()
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

    const resultPromise = await openLoginModal()

    fillField('device_settings:username', 'alice')
    clickPrimary('next')
    fillField('device_settings:password', 'temp-pass')
    clickPrimary('confirm')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'on_device_login_new_password' })
      ).toBeInTheDocument()
    })

    let modalResolved = false
    void Promise.resolve(resultPromise).then(() => {
      modalResolved = true
    })
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(modalResolved).toBe(false)
  })

  it('completes the new-password flow and resolves the modal', async () => {
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

    const resultPromise = await openLoginModal()

    fillField('device_settings:username', 'alice')
    clickPrimary('next')
    fillField('device_settings:password', 'temp-pass')
    clickPrimary('confirm')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'on_device_login_new_password' })
      ).toBeInTheDocument()
    })

    fillField('device_settings:on_device_login_new_password', 'newpass123')
    clickPrimary('next')
    fillField('device_settings:on_device_login_confirm_password', 'newpass123')
    clickPrimary('confirm')

    await expect(resultPromise).resolves.toEqual({ username: 'alice' })
  })

  it('shows an error when OAuth login fails', async () => {
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onError }) => ({
      submitPassword: () => {
        onError('Login failed')
      },
      isAuthLoading: false,
    }))

    await openLoginModal()

    fillField('device_settings:username', 'alice')
    clickPrimary('next')
    fillField('device_settings:password', 'wrong')
    clickPrimary('confirm')

    expect(screen.getByText('Login failed')).toBeInTheDocument()
  })
})
