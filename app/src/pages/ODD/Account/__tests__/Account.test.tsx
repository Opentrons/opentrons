import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { logOut } from '/app/redux/robot-auth'

import { Account } from '..'

import type { ComponentProps } from 'react'

vi.mock('/app/redux/discovery', () => ({
  getLocalRobot: vi.fn(() => ({ name: 'local-robot' })),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    useNavigate: () => mockNavigate,
  }
})

const onSaveNewPassword = vi.fn().mockResolvedValue(undefined)
const onSaveNewUsername = vi.fn().mockResolvedValue(undefined)
const onSaveNewLegalName = vi.fn().mockResolvedValue(undefined)
const onSaveNewRole = vi.fn().mockResolvedValue(undefined)
const onLockAccount = vi.fn().mockResolvedValue(undefined)
const onDeleteAccount = vi.fn().mockResolvedValue(undefined)
const onResetPassword = vi.fn().mockResolvedValue('temp-password')
const onUnlockAccount = vi.fn().mockResolvedValue('temp-password')

const DEFAULT_PROPS: ComponentProps<typeof Account> = {
  usernames: ['george_clooney'],
  passwordComplexity: null,
  username: 'george_clooney',
  fullName: 'George Clooney',
  onSaveNewPassword,
  onSaveNewUsername,
  onSaveNewLegalName,
}

const renderAccount = (
  props: Partial<ComponentProps<typeof Account>> = {},
  initialPath = '/account'
) => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/account"
          element={<Account {...DEFAULT_PROPS} {...props} />}
        />
      </Routes>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Account', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders account details when logged in', () => {
    renderAccount()

    screen.getByRole('heading', { name: 'Personal account settings' })
    screen.getByText('Username')
    screen.getByText('george_clooney')
    screen.getByText('Legal name')
    screen.getByText('George Clooney')
    screen.getByText('Password')
    screen.getByText('************************')
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(3)
  })

  it('dispatches logOut when the "log out" button is tapped', () => {
    const [, store] = renderAccount()

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(store.dispatch).toHaveBeenCalledWith(
      logOut({ robotName: 'local-robot' })
    )
  })

  it('navigates to the previous page when the back button is tapped', () => {
    renderAccount()

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('calls onBack when provided instead of navigating', () => {
    const mockOnBack = vi.fn()
    renderAccount({ onBack: mockOnBack })

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(mockOnBack).toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('hides username and legal name edit for a service account, but still allows password change and log out', () => {
    renderAccount({ accountType: 'service' })

    screen.getByRole('button', { name: 'Log out' })
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    screen.getByRole('heading', { name: 'New password' })
  })

  it('hides username and legal name edit for the recovery account, but still allows password change and log out', () => {
    renderAccount({
      username: 'recovery',
      usernames: ['recovery'],
      fullName: 'Recovery',
    })

    screen.getByRole('button', { name: 'Log out' })
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    screen.getByRole('heading', { name: 'New password' })
  })

  it('renders admin view details, role, and admin actions for a regular user', () => {
    renderAccount({
      adminView: true,
      accountType: 'user',
      onSaveNewRole,
      onLockAccount,
      onDeleteAccount,
      onResetPassword,
      onUnlockAccount,
    })

    screen.getByRole('heading', { name: 'User account details' })
    screen.getByText('Username')
    screen.getByText('george_clooney')
    screen.getByText('Legal name')
    screen.getByText('Role')
    screen.getByText('User')
    expect(screen.queryByText('Password')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(3)
    screen.getByRole('button', { name: 'Reset password' })
    screen.getByRole('button', { name: 'Lock account' })
    screen.getByRole('button', { name: 'Delete account' })
  })

  it('shows unlock instead of reset and lock when the account is locked in admin view', () => {
    renderAccount({
      adminView: true,
      accountType: 'user',
      locked: true,
      onSaveNewRole,
      onLockAccount,
      onDeleteAccount,
      onResetPassword,
      onUnlockAccount,
    })

    screen.getByRole('button', { name: 'Unlock account' })
    expect(
      screen.queryByRole('button', { name: 'Reset password' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Lock account' })
    ).not.toBeInTheDocument()
    screen.getByRole('button', { name: 'Delete account' })
  })

  it.each([
    {
      description: 'a service account',
      props: {
        username: 'service',
        fullName: 'Service Account',
        accountType: 'service' as const,
      },
    },
    {
      description: 'the recovery account',
      props: {
        username: 'recovery',
        fullName: 'Recovery',
        accountType: 'user' as const,
      },
    },
  ])(
    'hides edit, lock, and delete actions in admin view for $description',
    ({ props }) => {
      renderAccount({
        adminView: true,
        onSaveNewRole,
        onLockAccount,
        onDeleteAccount,
        onResetPassword,
        onUnlockAccount,
        ...props,
        usernames: [props.username],
      })

      screen.getByRole('heading', { name: 'User account details' })
      screen.getByRole('button', { name: 'Reset password' })
      expect(
        screen.queryByRole('button', { name: 'Edit' })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Lock account' })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Delete account' })
      ).not.toBeInTheDocument()
    }
  )
})
