import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { PasswordChange } from '../PasswordChange'

import type { ComponentProps } from 'react'
import type { AuthSettingsData } from '@opentrons/api-client'

vi.mock('/app/atoms/SoftwareKeyboard/NumericalKeyboard', () => ({
  NumericalKeyboard: () => <div>mock numerical keyboard</div>,
}))

const MOCK_AUTH_SETTINGS: AuthSettingsData = {
  maxNumberOfLoginAttempts: 5,
  passwordResetTime: 30 * 86400,
  passwordComplexityMinimumLength: null,
  passwordComplexitySpecialCharacters: false,
  idleLogout: 180,
  requireAdminCredsWhenUpdatingRobotSoftware: false,
  requireAdminCredsWhenSendingProtocolToRobot: false,
  requireAdminCredsForSignoffProtocol: false,
}

const render = (props: ComponentProps<typeof PasswordChange>): void => {
  renderWithProviders(<PasswordChange {...props} />, {
    i18nInstance: i18n,
  })
}

describe('PasswordChange', () => {
  let props: ComponentProps<typeof PasswordChange>

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

  it('renders the enabled password change preference', () => {
    render(props)

    screen.getByText('Password change requirement')
    screen.getByText('Require password changed after a certain amount of time')
    screen.getByText('Preferences')
    screen.getByText('Length of time')
    screen.getByText('30 days')
  })

  it('hides length of time when password change is disabled', () => {
    props.authSettings = {
      ...MOCK_AUTH_SETTINGS,
      passwordResetTime: null,
    }
    render(props)

    screen.getByText('Off')
    expect(screen.queryByText('Preferences')).not.toBeInTheDocument()
    expect(screen.queryByText('Length of time')).not.toBeInTheDocument()
  })

  it('enables password change with a default of 30 days', () => {
    props.authSettings = {
      ...MOCK_AUTH_SETTINGS,
      passwordResetTime: null,
    }
    render(props)

    fireEvent.click(
      screen.getByText(
        'Require password changed after a certain amount of time'
      )
    )
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordResetTime: 30 * 86400,
    })
  })

  it('disables password change by setting reset time to null', () => {
    render(props)

    fireEvent.click(
      screen.getByText(
        'Require password changed after a certain amount of time'
      )
    )
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordResetTime: null,
    })
  })

  it('opens the numeric length of time page and patches days converted to seconds', () => {
    render(props)

    fireEvent.click(screen.getByText('Length of time'))
    screen.getByText('Length of time before password change')
    screen.getByText(
      'Length of time before requiring users to change their password'
    )

    fireEvent.change(screen.getByLabelText('Number of days'), {
      target: { value: '90' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordResetTime: 90 * 86400,
    })
    screen.getByText('Password change requirement')
  })

  it('calls onClickBack from the main page', () => {
    render(props)

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onClickBack).toHaveBeenCalled()
  })

  it('treats a missing password reset time as off and enables the default', () => {
    props.authSettings = {}
    render(props)

    screen.getByText('Off')
    expect(screen.queryByText('Preferences')).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByText(
        'Require password changed after a certain amount of time'
      )
    )
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      passwordResetTime: 30 * 86400,
    })
  })
})
