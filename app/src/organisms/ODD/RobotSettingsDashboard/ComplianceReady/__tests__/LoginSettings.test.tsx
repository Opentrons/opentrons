import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { LoginSettings } from '../LoginSettings'

import type { ComponentProps } from 'react'
import type { AuthSettingsData } from '@opentrons/api-client'

vi.mock('/app/atoms/SoftwareKeyboard/NumericalKeyboard', () => ({
  NumericalKeyboard: () => <div>mock numerical keyboard</div>,
}))

const MOCK_AUTH_SETTINGS: AuthSettingsData = {
  maxNumberOfLoginAttempts: 5,
  passwordResetTime: 30 * 86400,
  passwordComplexityMinimumLength: 8,
  passwordComplexitySpecialCharacters: true,
  idleLogout: 180,
  requireAdminCredsWhenUpdatingRobotSoftware: false,
  requireAdminCredsWhenSendingProtocolToRobot: false,
  requireAdminCredsForSignoffProtocol: false,
}

const render = (props: ComponentProps<typeof LoginSettings>): void => {
  renderWithProviders(<LoginSettings {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LoginSettings', () => {
  let props: ComponentProps<typeof LoginSettings>

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

  it('renders login setting rows with current values', () => {
    render(props)

    screen.getByText('Login and security')
    screen.getByText('Maximum login attempts before account deactivation')
    screen.getByText('5 logins')
    screen.getByText(
      'Require password to be changed after a certain amount of time'
    )
    screen.getByText('30 days')
    screen.getByText('Password complexity requirements')
    screen.getByText('On')
    screen.getByText('Length of time for auto-logout due to inactivity')
    screen.getByText('3 mins')
  })

  it('renders Off when optional login settings are disabled', () => {
    props.authSettings = {
      ...MOCK_AUTH_SETTINGS,
      maxNumberOfLoginAttempts: null,
      passwordResetTime: null,
      passwordComplexityMinimumLength: null,
      idleLogout: null,
    }
    render(props)

    expect(screen.getAllByText('Off')).toHaveLength(4)
  })

  it('calls onClickBack from the list page', () => {
    render(props)

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onClickBack).toHaveBeenCalled()
  })

  it('opens maximum login attempts and patches on back', () => {
    render(props)

    fireEvent.click(
      screen.getByText('Maximum login attempts before account deactivation')
    )
    screen.getByText('Maximum login attempts')
    screen.getByText('Number of logins')

    fireEvent.change(screen.getByLabelText('Number of logins'), {
      target: { value: '3' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      maxNumberOfLoginAttempts: 3,
    })
    screen.getByText('Login and security')
  })

  it('opens password change settings', () => {
    render(props)

    fireEvent.click(
      screen.getByText(
        'Require password to be changed after a certain amount of time'
      )
    )
    screen.getByText('Password change requirement')
  })

  it('opens password complexity settings', () => {
    render(props)

    fireEvent.click(screen.getByText('Password complexity requirements'))
    screen.getByText('Require special characters')
  })

  it('opens idle logout and patches minutes converted to seconds', () => {
    render(props)

    fireEvent.click(
      screen.getByText('Length of time for auto-logout due to inactivity')
    )
    screen.getByText('Length of time for auto-logout')

    fireEvent.change(screen.getByLabelText('Number of minutes'), {
      target: { value: '10' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      idleLogout: 600,
    })
  })

  it('treats missing login setting keys as off and still allows saving a value', () => {
    props.authSettings = { idleLogout: 180 }
    render(props)

    expect(screen.getAllByText('Off')).toHaveLength(3)
    screen.getByText('3 mins')

    fireEvent.click(
      screen.getByText('Maximum login attempts before account deactivation')
    )
    fireEvent.change(screen.getByLabelText('Number of logins'), {
      target: { value: '2' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      maxNumberOfLoginAttempts: 2,
    })
  })
})
