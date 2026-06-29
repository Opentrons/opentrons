import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import {
  cleanup,
  fireEvent,
  render as renderWithUi,
  screen,
  waitFor,
} from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import {
  getAuthSettings,
  getRobotServerAccessControlSettings,
  patchAuthSettings,
  patchRobotServerAccessControlSettings,
} from '@opentrons/api-client'
import { ApiHostContext, getQueryKey } from '@opentrons/react-api-client'

import { i18n } from '/app/i18n'

import { UI_ONLY_FIELD_IDS } from '../complianceReadySettingsTypes'
import { ComplianceReadySoftwareSettings } from '../ComplianceReadySoftwareSettings'

import type {
  AuthSettingsResponse,
  HostConfig,
  RobotServerAccessControlSettingsResponse,
} from '@opentrons/api-client'

const MOCK_HOST: HostConfig = {
  hostname: '127.0.0.1',
  port: 31950,
  robotName: 'flex-1',
}

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

let authSettingsResponse: AuthSettingsResponse = MOCK_AUTH_SETTINGS
let robotServerAccessControlSettingsResponse: RobotServerAccessControlSettingsResponse =
  MOCK_ROBOT_SERVER_ACCESS_CONTROL_SETTINGS

vi.mock('@opentrons/api-client', async importOriginal => {
  const actual = await importOriginal()

  return {
    ...(actual as object),
    getAuthSettings: vi.fn(() =>
      Promise.resolve({ data: authSettingsResponse })
    ),
    patchAuthSettings: vi.fn((_host, body) => {
      authSettingsResponse = {
        data: { ...authSettingsResponse.data, ...body.data },
      }
      return Promise.resolve({ data: authSettingsResponse })
    }),
    getRobotServerAccessControlSettings: vi.fn(() =>
      Promise.resolve({ data: robotServerAccessControlSettingsResponse })
    ),
    patchRobotServerAccessControlSettings: vi.fn((_host, body) => {
      robotServerAccessControlSettingsResponse = {
        data: {
          ...robotServerAccessControlSettingsResponse.data,
          ...body.data,
        },
      }
      return Promise.resolve({ data: robotServerAccessControlSettingsResponse })
    }),
  }
})

const render = (): void => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  queryClient.setQueryData(
    getQueryKey(MOCK_HOST, 'auth', 'settings'),
    authSettingsResponse
  )
  queryClient.setQueryData(
    getQueryKey(MOCK_HOST, 'accessControl', 'settings'),
    robotServerAccessControlSettingsResponse
  )

  renderWithUi(
    <QueryClientProvider client={queryClient}>
      <Provider store={legacy_createStore(vi.fn(), {})}>
        <I18nextProvider i18n={i18n}>
          <ApiHostContext.Provider value={MOCK_HOST}>
            <ComplianceReadySoftwareSettings robotName="flex-1" />
          </ApiHostContext.Provider>
        </I18nextProvider>
      </Provider>
    </QueryClientProvider>
  )
}

const expandAccordion = (): void => {
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Compliance Ready Software settings',
    })
  )
}

describe('ComplianceReadySoftwareSettings', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    authSettingsResponse = {
      data: { ...MOCK_AUTH_SETTINGS.data },
    }
    robotServerAccessControlSettingsResponse = {
      data: { ...MOCK_ROBOT_SERVER_ACCESS_CONTROL_SETTINGS.data },
    }
    vi.mocked(getAuthSettings).mockClear()
    vi.mocked(patchAuthSettings).mockClear()
    vi.mocked(getRobotServerAccessControlSettings).mockClear()
    vi.mocked(patchRobotServerAccessControlSettings).mockClear()
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

  it('should patch password reset time after entering sub-setting value', async () => {
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

    await waitFor(() => {
      expect(patchAuthSettings).toHaveBeenCalledWith(MOCK_HOST, {
        data: { passwordResetTime: 90 * 24 * 60 * 60 },
      })
    })
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

    await waitFor(() => {
      expect(updateRobotsToggle).toHaveAttribute('aria-checked', 'false')
    })
    expect(patchAuthSettings).toHaveBeenCalledWith(MOCK_HOST, {
      data: { requireAdminCredsWhenUpdatingRobotSoftware: false },
    })
  })

  it('should update input values without patching until blur', async () => {
    render()
    expandAccordion()

    const loginAttemptsField = screen.getByLabelText(
      'Maximum login attempts before account deactivation'
    )
    fireEvent.change(loginAttemptsField, { target: { value: '3' } })
    expect(loginAttemptsField).toHaveValue(3)
    expect(patchAuthSettings).not.toHaveBeenCalled()

    fireEvent.blur(loginAttemptsField)

    await waitFor(() => {
      expect(patchAuthSettings).toHaveBeenCalledWith(MOCK_HOST, {
        data: { maxNumberOfLoginAttempts: 3 },
      })
    })
  })
})
