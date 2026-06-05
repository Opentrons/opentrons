import NiceModal from '@ebay/nice-modal-react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSelf } from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { useToaster } from '/app/organisms/ToasterOven'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  useOAuth2PasswordLogin,
  useUpdateNewPassword,
} from '/app/resources/auth'

import { showLoginModal } from '../LoginModal'

import type {
  AuthUser,
  AuthUserResponse,
  OAuth2TokenResponse,
} from '@opentrons/api-client'

vi.mock('react-i18next', async importOriginal => {
  const actual = await importOriginal<typeof import('react-i18next')>()
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  }
})

vi.mock('/app/redux/robot-auth', () => ({
  logOut: vi.fn(),
}))

vi.mock('/app/redux/discovery', () => ({
  getLocalRobot: vi.fn(() => null),
}))

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@opentrons/react-api-client')>()
  return {
    ...actual,
    useHost: vi.fn(),
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

function openLoginModal(): ReturnType<typeof showLoginModal> {
  renderWithProviders(
    <NiceModal.Provider>
      <div />
    </NiceModal.Provider>
  )

  let resultPromise!: ReturnType<typeof showLoginModal>
  act(() => {
    resultPromise = showLoginModal()
  })

  return resultPromise
}

describe('LoginModal', () => {
  const mockStoreLoginState = vi.fn()

  beforeEach(() => {
    vi.mocked(useHost).mockReturnValue({ hostname: 'localhost' })
    vi.mocked(useToaster).mockReturnValue({
      makeSnackbar: vi.fn(),
      makeToast: vi.fn(),
      eatToast: vi.fn(),
    })
    vi.mocked(useStoreLoginState).mockReturnValue(mockStoreLoginState)

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

  it('opens on the username step', () => {
    openLoginModal()

    expect(
      screen.getByLabelText('device_settings:username')
    ).toBeInTheDocument()
  })

  it('resolves with the username after a successful login', async () => {
    const resultPromise = openLoginModal()

    fillField('device_settings:username', 'alice')
    clickPrimary('next')
    fillField('device_settings:password', 'secret123')
    clickPrimary('confirm')

    await expect(resultPromise).resolves.toEqual({ username: 'alice' })
    expect(mockStoreLoginState).toHaveBeenCalledWith('alice', OAUTH_RESPONSE)
  })

  it('resolves with null when cancel is clicked', async () => {
    const resultPromise = openLoginModal()

    fireEvent.click(screen.getByTestId('ChildNavigation_Secondary_Button'))

    await expect(resultPromise).resolves.toBeNull()
  })

  it('switches to the new-password flow when login requires a password reset', async () => {
    mockGetSelfResponse(mockSelfUser({ resetPassword: true }))

    const resultPromise = openLoginModal()

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
    mockGetSelfResponse(mockSelfUser({ resetPassword: true }))

    const resultPromise = openLoginModal()

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

    openLoginModal()

    fillField('device_settings:username', 'alice')
    clickPrimary('next')
    fillField('device_settings:password', 'wrong')
    clickPrimary('confirm')

    expect(screen.getByText('Login failed')).toBeInTheDocument()
  })
})
