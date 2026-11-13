import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { AdminActions } from '../AdminActions'

import type { ComponentProps } from 'react'
import type { AuthSettingsData } from '@opentrons/api-client'

const MOCK_AUTH_SETTINGS: AuthSettingsData = {
  requireAdminCredsWhenUpdatingRobotSoftware: true,
  requireAdminCredsForSignoffProtocol: false,
}

const render = (props: ComponentProps<typeof AdminActions>): void => {
  renderWithProviders(<AdminActions {...props} />, {
    i18nInstance: i18n,
  })
}

describe('AdminActions', () => {
  let props: ComponentProps<typeof AdminActions>

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

  it('renders admin credential toggles with current values', () => {
    render(props)

    screen.getByText('Actions requiring admin credentials')
    screen.getByText('Require admin credentials to update robots')
    screen.getByText(
      'Require admin credentials to send protocols to this robot'
    )
    screen.getByText(
      'Require admin credentials for signature upon completing a protocol run'
    )
    expect(screen.getAllByText('On')).toHaveLength(1)
    expect(screen.getAllByText('Off')).toHaveLength(2)
  })

  it('calls onClickBack', () => {
    render(props)

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onClickBack).toHaveBeenCalled()
  })

  it('patches inverted admin credential settings on click', () => {
    render(props)

    fireEvent.click(
      screen.getByText('Require admin credentials to update robots')
    )
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      requireAdminCredsWhenUpdatingRobotSoftware: false,
    })

    fireEvent.click(
      screen.getByText(
        'Require admin credentials to send protocols to this robot'
      )
    )
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      requireAdminCredsWhenSendingProtocolToRobot: true,
    })

    fireEvent.click(
      screen.getByText(
        'Require admin credentials for signature upon completing a protocol run'
      )
    )
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      requireAdminCredsForSignoffProtocol: true,
    })
  })

  it('treats missing auth settings as off', () => {
    props.authSettings = undefined
    render(props)

    expect(screen.getAllByText('Off')).toHaveLength(3)
  })

  it('treats missing admin setting keys as off and toggles them on', () => {
    props.authSettings = {
      requireAdminCredsWhenUpdatingRobotSoftware: true,
    }
    render(props)

    expect(screen.getAllByText('On')).toHaveLength(1)
    expect(screen.getAllByText('Off')).toHaveLength(2)

    fireEvent.click(
      screen.getByText(
        'Require admin credentials to send protocols to this robot'
      )
    )
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      requireAdminCredsWhenSendingProtocolToRobot: true,
    })

    fireEvent.click(
      screen.getByText(
        'Require admin credentials for signature upon completing a protocol run'
      )
    )
    expect(props.patchAuthSettings).toHaveBeenCalledWith({
      requireAdminCredsForSignoffProtocol: true,
    })
  })
})
