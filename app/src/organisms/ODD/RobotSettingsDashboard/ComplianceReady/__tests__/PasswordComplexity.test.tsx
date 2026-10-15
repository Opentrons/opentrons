import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { PasswordComplexity } from '../PasswordComplexity'

import type { ComponentProps } from 'react'
import type { AuthSettingsData } from '@opentrons/api-client'

vi.mock('/app/atoms/SoftwareKeyboard/NumericalKeyboard', () => ({
  NumericalKeyboard: () => <div>mock numerical keyboard</div>,
}))

const MOCK_AUTH_SETTINGS: AuthSettingsData = {
  maxNumberOfLoginAttempts: 5,
  passwordResetTime: null,
  passwordComplexityMinimumLength: 8,
  passwordComplexitySpecialCharacters: true,
  idleLogout: 180,
  requireAdminCredsWhenUpdatingRobotSoftware: false,
  requireAdminCredsWhenSendingProtocolToRobot: false,
  requireAdminCredsForSignoffProtocol: false,
}

const render = (props: ComponentProps<typeof PasswordComplexity>): void => {
  renderWithProviders(<PasswordComplexity {...props} />, {
    i18nInstance: i18n,
  })
}

describe('PasswordComplexity', () => {
  let props: ComponentProps<typeof PasswordComplexity>

  beforeEach(() => {
    props = {
      authSettings: MOCK_AUTH_SETTINGS,
      onClickBack: vi.fn(),
      patchAuthSettings: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders preferences when password complexity is enabled', () => {
    render(props)

    expect(
      screen.getAllByText('Password complexity requirements')
    ).toHaveLength(2)
    screen.getByText('Preferences')
    screen.getByText('Require special characters')
    screen.getByText('Minimum password length')
    screen.getByText('8 chars')
  })

  it('hides preferences when password complexity is disabled', () => {
    props.authSettings = {
      ...MOCK_AUTH_SETTINGS,
      passwordComplexityMinimumLength: null,
      passwordComplexitySpecialCharacters: false,
    }
    render(props)

    expect(screen.queryByText('Preferences')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Require special characters')
    ).not.toBeInTheDocument()
  })

  it('shows a warning modal before enabling complexity and cancels without patching', () => {
    props.authSettings = {
      ...MOCK_AUTH_SETTINGS,
      passwordComplexityMinimumLength: null,
      passwordComplexitySpecialCharacters: false,
    }
    render(props)

    fireEvent.click(screen.getAllByText('Password complexity requirements')[1])
    screen.getByText('Require password complexity?')
    screen.getByText(
      'Enabling this setting will require users to reset their passwords to meet the new requirements the next time they sign in.'
    )
    expect(props.patchAuthSettings).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Cancel'))
    expect(
      screen.queryByText('Require password complexity?')
    ).not.toBeInTheDocument()
    expect(props.patchAuthSettings).not.toHaveBeenCalled()
  })

  it('patches default complexity settings when the warning is confirmed', () => {
    props.authSettings = {
      ...MOCK_AUTH_SETTINGS,
      passwordComplexityMinimumLength: null,
      passwordComplexitySpecialCharacters: false,
    }
    render(props)

    fireEvent.click(screen.getAllByText('Password complexity requirements')[1])
    fireEvent.click(screen.getByText('Confirm'))

    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordComplexitySpecialCharacters: true,
      passwordComplexityMinimumLength: 8,
    })
  })

  it('clears complexity settings when the requirement is turned off', () => {
    render(props)

    fireEvent.click(screen.getAllByText('Password complexity requirements')[1])
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordComplexitySpecialCharacters: false,
      passwordComplexityMinimumLength: null,
    })
  })

  it('patches special character requirement when that toggle is clicked', () => {
    render(props)

    fireEvent.click(screen.getByText('Require special characters'))
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordComplexitySpecialCharacters: false,
    })
  })

  it('opens minimum length and patches the entered value', () => {
    render(props)

    fireEvent.click(screen.getByText('Minimum password length'))
    screen.getByText('Input range 1-256')

    fireEvent.change(screen.getByLabelText('Number of characters'), {
      target: { value: '12' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordComplexityMinimumLength: 12,
    })
    screen.getByText('Preferences')
  })

  it('calls onClickBack from the main page', () => {
    render(props)

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onClickBack).toHaveBeenCalled()
  })

  it('treats missing complexity keys as disabled and enables defaults after confirm', () => {
    props.authSettings = {}
    render(props)

    expect(screen.queryByText('Preferences')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByText('Password complexity requirements')[1])
    fireEvent.click(screen.getByText('Confirm'))

    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordComplexitySpecialCharacters: true,
      passwordComplexityMinimumLength: 8,
    })
  })
})
