import NiceModal from '@ebay/nice-modal-react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSelf } from '@opentrons/api-client'
import { useHost, useSelfQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import {
  useOAuth2PasswordLogin,
  useUpdateNewPassword,
} from '/app/resources/auth'

import { useToaster } from '/app/organisms/ToasterOven'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import { showLoginModal } from '../LoginModal'

import type * as ReactI18next from 'react-i18next'
import type {
  AuthUser,
  AuthUserResponse,
  OAuth2TokenResponse,
} from '@opentrons/api-client'
import type { State } from '/app/redux/types'

vi.mock('react-i18next', async importOriginal => {
  const actual = await importOriginal<typeof ReactI18next>()
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  }
})

let mockIsLoggedIn = false
let mockCurrentUsername: string | null = null

vi.mock('/app/redux/robot-auth', () => ({
  getIsLoggedInToLocalRobot: () => mockIsLoggedIn,
  getCurrentUsernameForLocalRobot: () => mockCurrentUsername,
  logOut: vi.fn(),
}))

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@opentrons/react-api-client')>()
  return {
    ...actual,
    useHost: vi.fn(),
    useSelfQuery: vi.fn(),
  }
})

vi.mock('@opentrons/api-client', async importOriginal => {
  const actual = await importOriginal<typeof import('@opentrons/api-client')>()
  return {
    ...actual,
    getSelf: vi.fn(),
  }
})

vi.mock('/app/resources/auth', () => ({
  useOAuth2PasswordLogin: vi.fn(),
  useUpdateNewPassword: vi.fn(),
}))

vi.mock('/app/resources/access-control/useStoreLoginState', () => ({
  useStoreLoginState: vi.fn(),
}))

vi.mock('/app/organisms/ToasterOven', () => ({
  useToaster: vi.fn(),
}))

const LOGIN_MODAL_INITIAL_STATE = {
  discovery: { robotsByName: {}, scanning: false },
} satisfies Partial<State> as State

const OAUTH_RESPONSE: OAuth2TokenResponse = {
  token_type: 'Bearer',
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
}

const AUTH_USER: AuthUser = {
  username: 'alice',
  fullName: 'Alice',
  accountType: 'user',
  scopes: [],
  locked: false,
  resetPassword: false,
}

function mockSelfUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return { ...AUTH_USER, ...overrides }
}

function mockGetSelfResponse(user: AuthUser): void {
  vi.mocked(getSelf).mockResolvedValue({
    data: { data: user } as AuthUserResponse,
  } as Awaited<ReturnType<typeof getSelf>>)
}

function renderLoginModalProvider(): void {
  renderWithProviders(
    <NiceModal.Provider>
      <div />
    </NiceModal.Provider>,
    { initialState: LOGIN_MODAL_INITIAL_STATE }
  )
}

async function openLoginModal(): Promise<ReturnType<typeof showLoginModal>> {
  renderLoginModalProvider()

  let resultPromise!: ReturnType<typeof showLoginModal>
  await act(async () => {
    resultPromise = showLoginModal()
  })

  await screen.findByLabelText('device_settings:username')

  return resultPromise
}

describe('LoginModal', () => {
  const mockStoreLoginState = vi.fn()

  beforeEach(() => {
    mockIsLoggedIn = false
    mockCurrentUsername = null
    // useSelfQuery is only enabled when logged in; keep a safe default for logged-out tests.

    vi.mocked(useHost).mockReturnValue({ hostname: 'localhost' })
    vi.mocked(useToaster).mockReturnValue({
      makeSnackbar: vi.fn(),
      makeToast: vi.fn(),
      eatToast: vi.fn(),
    })
    vi.mocked(useStoreLoginState).mockReturnValue(mockStoreLoginState)
    vi.mocked(useSelfQuery).mockReturnValue({
      data: { data: { resetPassword: false } },
    } as ReturnType<typeof useSelfQuery>)

    vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
      submitPassword: (username: string, _password: string) => {
        onSuccess(username, OAUTH_RESPONSE)
      },
      isAuthLoading: false,
    }))

    vi.mocked(useUpdateNewPassword).mockImplementation(({ onSuccess }) => ({
      updateNewPassword: (username: string, _password: string) => {
        onSuccess(username, OAUTH_RESPONSE)
      },
      isLoading: false,
    }))

    mockGetSelfResponse(mockSelfUser())
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
    mockGetSelfResponse(mockSelfUser({ resetPassword: true }))

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
    void resultPromise.then(() => {
      modalResolved = true
    })
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(modalResolved).toBe(false)
  })

  it('skips to the new-password flow when already logged in with reset required', async () => {
    mockIsLoggedIn = true
    mockCurrentUsername = 'alice'
    vi.mocked(useSelfQuery).mockReturnValue({
      data: { data: { resetPassword: true } },
    } as ReturnType<typeof useSelfQuery>)

    renderLoginModalProvider()
    await act(async () => {
      showLoginModal()
    })

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'on_device_login_new_password' })
      ).toBeInTheDocument()
    })
  })

  it('completes the new-password flow and resolves the modal', async () => {
    mockGetSelfResponse(mockSelfUser({ resetPassword: true }))

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

    mockGetSelfResponse(mockSelfUser({ resetPassword: false }))

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

    await waitFor(() => {
      expect(screen.getByText('Login failed')).toBeInTheDocument()
    })
  })
})
