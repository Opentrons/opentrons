import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { useAuthSettingsQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import {
  ComplianceReadySoftwareSettings,
  SETTINGS_SECTIONS,
  UI_ONLY_FIELD_IDS,
} from '../ComplianceReadySoftwareSettings'

import type { AuthSettingsResponse } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@opentrons/react-api-client')>()

  return {
    ...actual,
    useAuthSettingsQuery: vi.fn(),
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

const AUTH_SETTING_KEYS = Object.keys({
  maxNumberOfLoginAttempts: null,
  passwordResetTime: null,
  passwordComplexityMinimumLength: null,
  passwordComplexitySpecialCharacters: false,
  idleLogout: 180,
  requireReasonForInteraction: true,
  minLengthOfReasonForInteraction: null,
  requireAdminCredsWhenUpdatingRobotSoftware: true,
  requireAdminCredsWhenSendingProtocolToRobot: true,
  requireAdminCredsForSignoffProtocol: false,
} satisfies AuthSettingsResponse['data'])

function getFieldIds(
  fields: (typeof SETTINGS_SECTIONS)[number]['fields']
): string[] {
  return fields.flatMap(field => {
    if (field.type === 'input') {
      return [field.id]
    }

    return [
      field.id,
      ...(field.children != null ? getFieldIds(field.children) : []),
    ]
  })
}

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
  beforeEach(() => {
    vi.mocked(useAuthSettingsQuery).mockReturnValue({
      data: MOCK_AUTH_SETTINGS,
      isLoading: false,
    } as ReturnType<typeof useAuthSettingsQuery>)
  })

  it('should only use auth setting ids or explicit UI-only ids', () => {
    const allowedIds = new Set<string>([
      ...AUTH_SETTING_KEYS,
      ...UI_ONLY_FIELD_IDS,
    ])

    SETTINGS_SECTIONS.flatMap(section => getFieldIds(section.fields)).forEach(
      fieldId => {
        expect(allowedIds.has(fieldId)).toBe(true)
      }
    )
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

  it('should update toggle state', () => {
    render()
    expandAccordion()

    const updateRobotsToggle = screen.getByRole('switch', {
      name: 'Require admin credentials to update robots',
    })

    expect(updateRobotsToggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(updateRobotsToggle)
    expect(updateRobotsToggle).toHaveAttribute('aria-checked', 'false')
  })

  it('should update input values', () => {
    render()
    expandAccordion()

    const loginAttemptsField = screen.getByLabelText(
      'Maximum login attempts before account deactivation'
    )
    fireEvent.change(loginAttemptsField, { target: { value: '3' } })
    expect(loginAttemptsField).toHaveValue(3)
  })
})
