import '@testing-library/jest-dom/vitest'

import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useHost,
  useSelfQuery,
  useUpdateSelfMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { PersonalAccountSettings } from '../PersonalAccountSettings'

import type { RenderResult } from '@testing-library/react'
import type { AuthUserResponse } from '@opentrons/api-client'

const ROBOT_NAME = 'flex-1'

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

const mockUpdateSelf = vi.fn()

const render = (): RenderResult => {
  return renderWithProviders(
    <PersonalAccountSettings robotName={ROBOT_NAME} />,
    { i18nInstance: i18n }
  )[0]
}

function getPasswordInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('input')).filter(
    (input): input is HTMLInputElement => input.type === 'password'
  )
}

function openEditForm(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
}

describe('PersonalAccountSettings', () => {
  beforeEach(() => {
    mockUpdateSelf.mockReset()
    mockUpdateSelf.mockResolvedValue(undefined)
    vi.mocked(useHost).mockReturnValue({
      hostname: '10.0.0.1',
      port: 31950,
    } as ReturnType<typeof useHost>)
    vi.mocked(useSelfQuery).mockReturnValue({
      data: MOCK_SELF_RESPONSE,
    } as any)
    vi.mocked(useUpdateSelfMutation).mockReturnValue({
      updateSelf: mockUpdateSelf,
      isLoading: false,
    } as any)
  })

  it('renders view mode and toggles between view and edit', () => {
    render()
    screen.getByText('Personal account settings')
    screen.getByText('alice')
    screen.getByText('Alice Example')
    screen.getByText('••••••••')
    screen.getByRole('button', { name: 'Edit' })

    openEditForm()
    expect(screen.getByDisplayValue('alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice Example')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled()

    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[1]!)
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'save' })
    ).not.toBeInTheDocument()
  })

  it('calls updateSelf and returns to view mode on successful save', async () => {
    const { container } = render()
    openEditForm()
    fireEvent.change(screen.getByDisplayValue('Alice Example'), {
      target: { value: 'Alice Updated' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'save' }))

    await waitFor(() => {
      expect(mockUpdateSelf).toHaveBeenCalledOnce()
    })
    const updateData = mockUpdateSelf.mock.calls[0][0].data
    expect(updateData).toEqual({ fullName: 'Alice Updated' })
    expect(updateData).not.toHaveProperty('username')
    expect(updateData).not.toHaveProperty('password')
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'save' })
    ).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('Alice Updated')
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
        const [passwordInput, confirmPasswordInput] =
          getPasswordInputs(container)
        fireEvent.change(passwordInput, { target: { value: 'new-password' } })
        fireEvent.change(confirmPasswordInput, {
          target: { value: 'new-password' },
        })
      },
      expectedData: { password: 'new-password' },
    },
  ])(
    'calls updateSelf with $description when password fields are otherwise empty',
    async ({ applyChange, expectedData }) => {
      const { container } = render()
      openEditForm()
      applyChange(container)
      fireEvent.click(screen.getByRole('button', { name: 'save' }))

      await waitFor(() => {
        expect(mockUpdateSelf).toHaveBeenCalledWith({ data: expectedData })
      })
    }
  )

  it('shows a save error when updateSelf fails', async () => {
    mockUpdateSelf.mockRejectedValue(new Error('save failed'))
    render()
    openEditForm()
    fireEvent.change(screen.getByDisplayValue('alice'), {
      target: { value: 'alice2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'save' }))

    await waitFor(() => {
      screen.getByText('Unable to save account settings. Try again.')
    })
    expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument()
  })
})
