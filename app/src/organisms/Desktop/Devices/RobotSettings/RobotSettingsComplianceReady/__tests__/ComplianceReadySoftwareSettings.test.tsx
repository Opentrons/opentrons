import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import {
  useAuthSettingsMutation,
  useAuthSettingsQuery,
  useGetRobotServerAccessControlSettingsQuery,
  usePatchRobotServerAccessControlSettingsMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { UI_ONLY_FIELD_IDS } from '../complianceReadySettingsTypes'
import { ComplianceReadySoftwareSettings } from '../ComplianceReadySoftwareSettings'

import type {
  AuthSettingsResponse,
  RobotServerAccessControlSettingsResponse,
} from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal()

  return {
    ...(actual as object),
    useAuthSettingsQuery: vi.fn(),
    useGetRobotServerAccessControlSettingsQuery: vi.fn(),
    useAuthSettingsMutation: vi.fn(),
    usePatchRobotServerAccessControlSettingsMutation: vi.fn(),
  }
})

const MOCK_AUTH_SETTINGS: AuthSettingsResponse = {
  data: {
    maxNumberOfLoginAttempts: 5,
    passwordResetTime: null,
    passwordComplexityMinimumLength: null,
    passwordComplexitySpecialCharacters: false,
    idleLogout: 180,
    requireReasonForInteraction: true,
    minLengthOfReasonForInteraction: null,
    requireAdminCredsWhenUpdatingRobotSoftware: true,
    requireAdminCredsWhenSendingProtocolToRobot: true,
    requireAdminCredsForSignoffProtocol: false,
  },
}

const MOCK_ROBOT_SERVER_ACCESS_CONTROL_SETTINGS: RobotServerAccessControlSettingsResponse =
  {
    data: {
      requireSignoffForProtocolLog: true,
      requireLogsToBeSavedInApp: false,
      deleteOverMaxOnDiskProtocols: true,
    },
  }

const AUTH_SETTING_KEYS = Object.keys(MOCK_AUTH_SETTINGS.data)
const ROBOT_SERVER_ACCESS_CONTROL_SETTING_KEYS = Object.keys(
  MOCK_ROBOT_SERVER_ACCESS_CONTROL_SETTINGS.data
)

const COMPLIANCE_READY_FIELD_IDS = [
  'maxNumberOfLoginAttempts',
  'passwordResetEnabled',
  'passwordResetTime',
  'passwordComplexityEnabled',
  'passwordComplexitySpecialCharacters',
  'passwordComplexityMinimumLength',
  'idleLogout',
  'requireAdminCredsWhenUpdatingRobotSoftware',
  'requireAdminCredsWhenSendingProtocolToRobot',
  'requireAdminCredsForSignoffProtocol',
  'requireSignoffForProtocolLog',
  'deleteOverMaxOnDiskProtocols',
  'requireReasonForInteraction',
  'minLengthOfReasonForInteraction',
]

const render = (): void => {
  renderWithProviders(<ComplianceReadySoftwareSettings robotName="flex-1" />, {
    i18nInstance: i18n,
  })
}

const expandAccordion = (): void => {
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Compliance Ready Software settings',
    })
  )
}

describe('ComplianceReadySoftwareSettings', () => {
  const patchAuthSettings = vi.fn()
  const patchRobotServerAccessControlSettings = vi.fn()

  beforeEach(() => {
    patchAuthSettings.mockClear()
    patchRobotServerAccessControlSettings.mockClear()

    patchAuthSettings.mockImplementation((request, options) => {
      options?.onSuccess?.({
        data: {
          ...MOCK_AUTH_SETTINGS.data,
          ...request.data,
        },
      })
    })
    patchRobotServerAccessControlSettings.mockImplementation(
      (request, options) => {
        options?.onSuccess?.({
          data: {
            ...MOCK_ROBOT_SERVER_ACCESS_CONTROL_SETTINGS.data,
            ...request.data,
          },
        })
      }
    )

    vi.mocked(useAuthSettingsMutation).mockReturnValue({
      patchAuthSettings,
    } as unknown as ReturnType<typeof useAuthSettingsMutation>)
    vi.mocked(usePatchRobotServerAccessControlSettingsMutation).mockReturnValue(
      {
        patchRobotServerAccessControlSettings,
      } as unknown as ReturnType<
        typeof usePatchRobotServerAccessControlSettingsMutation
      >
    )
    vi.mocked(useAuthSettingsQuery).mockReturnValue({
      data: MOCK_AUTH_SETTINGS,
      isLoading: false,
    } as ReturnType<typeof useAuthSettingsQuery>)
    vi.mocked(useGetRobotServerAccessControlSettingsQuery).mockReturnValue({
      data: MOCK_ROBOT_SERVER_ACCESS_CONTROL_SETTINGS,
      isLoading: false,
    } as ReturnType<typeof useGetRobotServerAccessControlSettingsQuery>)
  })

  it('should only use auth setting ids, robot server setting ids, or explicit UI-only ids', () => {
    const allowedIds = new Set<string>([
      ...AUTH_SETTING_KEYS,
      ...ROBOT_SERVER_ACCESS_CONTROL_SETTING_KEYS,
      ...UI_ONLY_FIELD_IDS,
    ])

    COMPLIANCE_READY_FIELD_IDS.forEach(fieldId => {
      expect(allowedIds.has(fieldId)).toBe(true)
    })
  })

  it('should render settings sections when expanded', () => {
    render()
    expandAccordion()

    screen.getByText('Login and security')
    screen.getByText('Actions requiring admin credentials')
    screen.getByText('Protocol logs')
    screen.getByText('Audit log requirements')
    screen.getByText('Maximum login attempts before account deactivation')
  })

  it('should start with the accordion collapsed', () => {
    render()

    expect(
      screen.getByRole('button', {
        name: 'Compliance Ready Software settings',
      })
    ).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Login and security')).not.toBeInTheDocument()
  })

  it('should show nested inputs only after enabling the parent toggle', () => {
    render()
    expandAccordion()

    expect(screen.queryByText('Edit length of time')).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('switch', {
        name: 'Require password to be changed after a certain amount of time',
      })
    )

    screen.getByText('Edit length of time')
    expect(patchAuthSettings).not.toHaveBeenCalled()
  })

  it('should patch password reset time after entering sub-setting value', () => {
    render()
    expandAccordion()

    fireEvent.click(
      screen.getByRole('switch', {
        name: 'Require password to be changed after a certain amount of time',
      })
    )

    const passwordResetTimeField = screen.getByLabelText('Edit length of time')
    fireEvent.change(passwordResetTimeField, {
      target: { value: '90' },
    })
    expect(patchAuthSettings).not.toHaveBeenCalled()

    fireEvent.blur(passwordResetTimeField)

    expect(patchAuthSettings).toHaveBeenCalledWith(
      { data: { passwordResetTime: 90 * 24 * 60 * 60 } },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it('should populate fields from auth settings', () => {
    render()
    expandAccordion()

    expect(
      screen.getByLabelText(
        'Maximum login attempts before account deactivation'
      )
    ).toHaveValue(5)
    expect(
      screen.getByLabelText('Length of time for auto-logout due to inactivity')
    ).toHaveValue(3)
    expect(
      screen.getByRole('switch', {
        name: 'Require admin credentials to update robots',
      })
    ).toHaveAttribute('aria-checked', 'true')
  })

  it('should populate protocol log fields from robot server settings', () => {
    render()
    expandAccordion()

    expect(
      screen.getByRole('switch', {
        name: 'Require signoff for protocol logs',
      })
    ).toHaveAttribute('aria-checked', 'true')
    expect(
      screen.getByRole('switch', {
        name: 'Automatically delete protocol run logs on the robot when there are 20 protocol run records',
      })
    ).toHaveAttribute('aria-checked', 'true')
  })

  it('should update toggle state', async () => {
    render()
    expandAccordion()

    const updateRobotsToggle = screen.getByRole('switch', {
      name: 'Require admin credentials to update robots',
    })

    expect(updateRobotsToggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(updateRobotsToggle)
    expect(updateRobotsToggle).toHaveAttribute('aria-checked', 'false')
    expect(patchAuthSettings).toHaveBeenCalledWith(
      { data: { requireAdminCredsWhenUpdatingRobotSoftware: false } },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it('should update input values without patching until blur', () => {
    render()
    expandAccordion()

    const loginAttemptsField = screen.getByLabelText(
      'Maximum login attempts before account deactivation'
    )
    fireEvent.change(loginAttemptsField, { target: { value: '3' } })
    expect(loginAttemptsField).toHaveValue(3)
    expect(patchAuthSettings).not.toHaveBeenCalled()

    fireEvent.blur(loginAttemptsField)
    expect(patchAuthSettings).toHaveBeenCalledWith(
      { data: { maxNumberOfLoginAttempts: 3 } },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })
})
