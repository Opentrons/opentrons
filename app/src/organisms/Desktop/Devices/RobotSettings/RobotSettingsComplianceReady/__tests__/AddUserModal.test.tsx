import '@testing-library/jest-dom/vitest'

import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateUserMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'

import { AddUserModal } from '../UserManagement/AddUserModal'

import type { ComponentProps } from 'react'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const mockCreateUser = vi.fn()

const render = (props: ComponentProps<typeof AddUserModal>) => {
  return renderWithProviders(<AddUserModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AddUserModal', () => {
  let props: ComponentProps<typeof AddUserModal>

  beforeEach(() => {
    props = {
      robotName: 'flex-1',
      onClose: vi.fn(),
      onUserCreated: vi.fn(),
    }
    mockCreateUser.mockReset()
    vi.mocked(useCreateUserMutation).mockReturnValue({
      createUser: mockCreateUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useCreateUserMutation>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the create account header and description with an enabled submit button', () => {
    render(props)
    screen.getByText(
      'Create an account to use the robot with Compliance Ready Software.'
    )
    const createAccountButton = screen.getByRole('button', {
      name: 'Create account',
    })
    expect(createAccountButton).toBeEnabled()
    expect(screen.getAllByRole('textbox')[0]).toHaveFocus()
    screen.getAllByText('Create account')
  })

  it('shows required field errors when Create account is clicked with empty fields', async () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      screen.getByText('Username is required')
      screen.getByText('Legal name is required')
    })
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('shows a max length error when the username is too long', async () => {
    render(props)
    const [usernameInput, legalNameInput] = screen.getAllByRole('textbox')
    fireEvent.change(usernameInput, {
      target: { value: 'thisusernameistoolong1' },
    })
    fireEvent.change(legalNameInput, { target: { value: 'Ada Lovelace' } })

    await waitFor(() => {
      screen.getByText('20 characters max')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => {
      expect(mockCreateUser).not.toHaveBeenCalled()
    })
  })

  it('shows an invalid character error when the username contains a space', async () => {
    render(props)
    const [usernameInput, legalNameInput] = screen.getAllByRole('textbox')
    fireEvent.change(usernameInput, { target: { value: 'test user' } })
    fireEvent.change(legalNameInput, { target: { value: 'Ada Lovelace' } })

    await waitFor(() => {
      screen.getByText(
        'Usernames can include letters, numbers, and punctuation from the on-device keyboard.'
      )
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => {
      expect(mockCreateUser).not.toHaveBeenCalled()
    })
  })

  it('creates a user when the form is valid', async () => {
    mockCreateUser.mockResolvedValue({
      data: { temporaryPassword: 'temp-password' },
    })
    render(props)
    const [usernameInput, legalNameInput] = screen.getAllByRole('textbox')
    fireEvent.change(usernameInput, { target: { value: 'ada' } })
    fireEvent.change(legalNameInput, { target: { value: 'Ada Lovelace' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({
        data: {
          username: 'ada',
          fullName: 'Ada Lovelace',
          accountType: 'admin',
        },
      })
    })
    screen.getByText('temp-password')
  })
})
