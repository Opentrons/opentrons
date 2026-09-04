import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { logOut } from '/app/redux/robot-auth'

import { Account } from '..'
import { useAccountInfo } from '../hooks'

vi.mock('/app/redux/discovery', () => ({
  getLocalRobot: vi.fn(() => ({ name: 'local-robot' })),
}))
vi.mock('../hooks', () => ({
  useAccountInfo: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    useNavigate: () => mockNavigate,
  }
})

const renderAccount = (initialPath = '/account') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/account" element={<Account />} />
      </Routes>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders account details when logged in', () => {
    vi.mocked(useAccountInfo).mockReturnValue({
      isLoggedIn: true,
      username: 'george_clooney',
      fullName: 'George Clooney',
    })

    renderAccount()

    screen.getByRole('heading', { name: 'Account' })
    screen.getByText('Username')
    screen.getByText('george_clooney')
    screen.getByText('Legal name')
    screen.getByText('George Clooney')
    screen.getByText('Manage user account details in the Opentrons App')
  })

  it('renders a blank page, then navigates to the previous page, when the user is not logged in', async () => {
    vi.mocked(useAccountInfo).mockReturnValue({
      isLoggedIn: false,
      username: null,
      fullName: null,
    })

    renderAccount()

    screen.getByRole('heading', { name: 'Account' })
    screen.getByText('Username')
    screen.getByText('Legal name')

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })
  })

  it('dispatches logOut when the "log out" button is tapped', () => {
    vi.mocked(useAccountInfo).mockReturnValue({
      isLoggedIn: true,
      username: 'username',
      fullName: 'Full Name',
    })

    const [, store] = renderAccount()

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(store.dispatch).toHaveBeenCalledWith(
      logOut({ robotName: 'local-robot' })
    )
  })

  it('navigates to the previous page when the back button is tapped', () => {
    vi.mocked(useAccountInfo).mockReturnValue({
      isLoggedIn: true,
      username: 'george_clooney',
      fullName: 'George Clooney',
    })

    renderAccount()

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })
})
