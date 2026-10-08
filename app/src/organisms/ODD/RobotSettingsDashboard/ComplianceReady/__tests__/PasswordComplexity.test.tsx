import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import {
  DEFAULT_PASSWORD_COMPLEXITY_DISABLED_SETTINGS,
  DEFAULT_PASSWORD_COMPLEXITY_SETTINGS,
} from '../constants'
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

const clickHeaderConfirm = (): void => {
  fireEvent.click(screen.getByTestId('ChildNavigation_Primary_Button'))
}

const clickModalConfirm = (): void => {
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' })
  )
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
    expect(
      screen.queryByTestId('ChildNavigation_Primary_Button')
    ).not.toBeInTheDocument()
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

  it('stages enabling complexity and shows a warning on confirm', () => {
    props.authSettings = {
      ...MOCK_AUTH_SETTINGS,
      passwordComplexityMinimumLength: null,
      passwordComplexitySpecialCharacters: false,
    }
    render(props)

    fireEvent.click(screen.getAllByText('Password complexity requirements')[1])
    screen.getByText('Preferences')
    expect(
      screen.queryByText('Require password complexity?')
    ).not.toBeInTheDocument()
    expect(props.patchAuthSettings).not.toHaveBeenCalled()

    clickHeaderConfirm()
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

  it('patches staged complexity settings when the warning is confirmed', () => {
    props.authSettings = {
      ...MOCK_AUTH_SETTINGS,
      passwordComplexityMinimumLength: null,
      passwordComplexitySpecialCharacters: false,
    }
    render(props)

    fireEvent.click(screen.getAllByText('Password complexity requirements')[1])
    clickHeaderConfirm()
    clickModalConfirm()

    expect(props.patchAuthSettings).toHaveBeenCalledWith(
      DEFAULT_PASSWORD_COMPLEXITY_SETTINGS
    )
  })

  it('patches cleared complexity settings when turning the requirement off', () => {
    render(props)

    fireEvent.click(screen.getAllByText('Password complexity requirements')[1])
    expect(screen.queryByText('Preferences')).not.toBeInTheDocument()
    expect(props.patchAuthSettings).not.toHaveBeenCalled()
    expect(
      screen.queryByText('Require password complexity?')
    ).not.toBeInTheDocument()

    clickHeaderConfirm()
    expect(props.patchAuthSettings).toHaveBeenCalledWith(
      DEFAULT_PASSWORD_COMPLEXITY_DISABLED_SETTINGS
    )
  })

  it('patches special character requirement after confirm', () => {
    render(props)

    fireEvent.click(screen.getByText('Require special characters'))
    expect(props.patchAuthSettings).not.toHaveBeenCalled()

    clickHeaderConfirm()
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordComplexityMinimumLength: 8,
      passwordComplexitySpecialCharacters: false,
    })
    expect(
      screen.queryByText('Require password complexity?')
    ).not.toBeInTheDocument()
  })

  it('warns before confirming a newly required special character setting', () => {
    props.authSettings = {
      ...MOCK_AUTH_SETTINGS,
      passwordComplexitySpecialCharacters: false,
    }
    render(props)

    fireEvent.click(screen.getByText('Require special characters'))
    clickHeaderConfirm()
    screen.getByText('Require password complexity?')

    clickModalConfirm()
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordComplexityMinimumLength: 8,
      passwordComplexitySpecialCharacters: true,
    })
  })

  it('stages a longer minimum length and patches it after the warning', () => {
    render(props)

    fireEvent.click(screen.getByText('Minimum password length'))
    screen.getByText('Input range 1-256')

    fireEvent.change(screen.getByLabelText('Number of characters'), {
      target: { value: '12' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    expect(props.patchAuthSettings).not.toHaveBeenCalled()
    screen.getByText('Preferences')
    screen.getByText('12 chars')

    clickHeaderConfirm()
    screen.getByText('Require password complexity?')
    clickModalConfirm()

    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordComplexityMinimumLength: 12,
      passwordComplexitySpecialCharacters: true,
    })
  })

  it('patches a shorter minimum length without a warning', () => {
    render(props)

    fireEvent.click(screen.getByText('Minimum password length'))
    fireEvent.change(screen.getByLabelText('Number of characters'), {
      target: { value: '4' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    clickHeaderConfirm()

    expect(
      screen.queryByText('Require password complexity?')
    ).not.toBeInTheDocument()
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordComplexityMinimumLength: 4,
      passwordComplexitySpecialCharacters: true,
    })
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
    clickHeaderConfirm()
    clickModalConfirm()

    expect(props.patchAuthSettings).toHaveBeenCalledWith(
      DEFAULT_PASSWORD_COMPLEXITY_SETTINGS
    )
  })
})
