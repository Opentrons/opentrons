import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import {
  useAuditSettingsMutation,
  useAuditSettingsQuery,
  useAuthSettingsMutation,
  useAuthSettingsQuery,
  useGetRobotServerAccessControlSettingsQuery,
  usePatchRobotServerAccessControlSettingsMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useLogout } from '/app/redux/robot-auth'

import { ComplianceReadySettings } from '../ComplianceReadySettings'

import type { ComponentProps } from 'react'
import type {
  AuditSettingsResponse,
  AuthSettingsResponse,
  RobotServerAccessControlSettingsResponse,
} from '@opentrons/api-client'
import type * as ReactApiClient from '@opentrons/react-api-client'
import type * as RobotAuth from '/app/redux/robot-auth'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    useAuditSettingsMutation: vi.fn(),
    useAuditSettingsQuery: vi.fn(),
    useAuthSettingsMutation: vi.fn(),
    useAuthSettingsQuery: vi.fn(),
    useGetRobotServerAccessControlSettingsQuery: vi.fn(),
    usePatchRobotServerAccessControlSettingsMutation: vi.fn(),
  }
})
vi.mock('/app/local-resources/access-control/useDocumentationState')
vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal<typeof RobotAuth>()
  return {
    ...actual,
    useLogout: vi.fn(),
  }
})
vi.mock('/app/atoms/SoftwareKeyboard/NumericalKeyboard', () => ({
  NumericalKeyboard: () => <div>mock numerical keyboard</div>,
}))

const MOCK_AUTH_SETTINGS: AuthSettingsResponse = {
  data: {
    maxNumberOfLoginAttempts: 5,
    passwordResetTime: null,
    passwordComplexityMinimumLength: null,
    passwordComplexitySpecialCharacters: false,
    idleLogout: 180,
    requireAdminCredsWhenUpdatingRobotSoftware: true,
    requireAdminCredsWhenSendingProtocolToRobot: true,
    requireAdminCredsForSignoffProtocol: false,
  },
}

const MOCK_AUDIT_SETTINGS: AuditSettingsResponse = {
  data: {
    requireReasonForInteraction: true,
    minLengthOfReasonForInteraction: 8,
  },
}

const MOCK_ROBOT_SERVER_SETTINGS: RobotServerAccessControlSettingsResponse = {
  data: {
    requireSignoffForProtocolLog: true,
    requireLogsToBeSavedInApp: false,
    deleteOverMaxOnDiskProtocols: true,
  },
}

const mockPatchAuthSettings = vi.fn()
const mockPatchAuditSettings = vi.fn()
const mockPatchRobotServerSettings = vi.fn()
const mockLogout = vi.fn()

const render = (
  props: ComponentProps<typeof ComplianceReadySettings>
): void => {
  renderWithProviders(<ComplianceReadySettings {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ComplianceReadySettings', () => {
  let props: ComponentProps<typeof ComplianceReadySettings>

  beforeEach(() => {
    props = {
      setCurrentOption: vi.fn(),
    }
    vi.mocked(useDocumentationState).mockReturnValue(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    vi.mocked(useLogout).mockReturnValue(mockLogout)
    vi.mocked(useAuthSettingsQuery).mockReturnValue({
      data: MOCK_AUTH_SETTINGS,
    } as ReturnType<typeof useAuthSettingsQuery>)
    vi.mocked(useAuditSettingsQuery).mockReturnValue({
      data: MOCK_AUDIT_SETTINGS,
    } as ReturnType<typeof useAuditSettingsQuery>)
    vi.mocked(useGetRobotServerAccessControlSettingsQuery).mockReturnValue({
      data: MOCK_ROBOT_SERVER_SETTINGS,
    } as ReturnType<typeof useGetRobotServerAccessControlSettingsQuery>)
    vi.mocked(useAuthSettingsMutation).mockReturnValue({
      mutate: mockPatchAuthSettings,
    } as any)
    vi.mocked(useAuditSettingsMutation).mockReturnValue({
      mutate: mockPatchAuditSettings,
    } as any)
    vi.mocked(usePatchRobotServerAccessControlSettingsMutation).mockReturnValue(
      {
        mutate: mockPatchRobotServerSettings,
      } as any
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the settings list', () => {
    render(props)

    screen.getByText('Compliance Ready Software')
    screen.getByText('Login and security')
    screen.getByText('Actions requiring admin credentials')
    screen.getByText('Audit log requiements')
    screen.getByText('Robot storage')
  })

  it('calls setCurrentOption when the back button is clicked', () => {
    render(props)

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.setCurrentOption).toHaveBeenCalledWith(null)
  })

  it('navigates to login settings and back to the list', () => {
    render(props)

    fireEvent.click(screen.getByText('Login and security'))
    screen.getByText('Maximum login attempts before account deactivation')
    screen.getByText('5 logins')

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    screen.getByText('Compliance Ready Software')
    screen.getByText('Login and security')
  })

  it('navigates to admin actions and patches changed settings', () => {
    render(props)

    fireEvent.click(screen.getByText('Actions requiring admin credentials'))
    screen.getByText('Require admin credentials to update robots')

    fireEvent.click(
      screen.getByText('Require admin credentials to update robots')
    )
    expect(mockPatchAuthSettings).toHaveBeenCalledWith({
      data: { requireAdminCredsWhenUpdatingRobotSoftware: false },
    })
  })

  it('does not patch auth settings when the value is unchanged', () => {
    render(props)

    fireEvent.click(screen.getByText('Login and security'))
    fireEvent.click(
      screen.getByText('Maximum login attempts before account deactivation')
    )
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    expect(mockPatchAuthSettings).not.toHaveBeenCalled()
  })

  it('navigates to audit log requirements and patches robot server settings', () => {
    render(props)

    fireEvent.click(screen.getByText('Audit log requiements'))
    screen.getByText('Require documentation for robot actions')
    screen.getByText('8 chars')

    fireEvent.click(
      screen.getByText('Require signature upon completing a protocol run')
    )
    expect(mockPatchRobotServerSettings).toHaveBeenCalledWith({
      data: { requireSignoffForProtocolLog: false },
    })
  })

  it('navigates to robot storage and patches changed settings', () => {
    render(props)

    fireEvent.click(screen.getByText('Robot storage'))
    fireEvent.click(
      screen.getByText(
        'Automatically delete the oldest protocol run record when the robot reaches the maximum of 20 saved records'
      )
    )

    expect(mockPatchRobotServerSettings).toHaveBeenCalledWith({
      data: { deleteOverMaxOnDiskProtocols: false },
    })
  })

  it('treats missing settings keys as off and still patches toggles', () => {
    vi.mocked(useAuthSettingsQuery).mockReturnValue({
      data: { data: {} },
    } as ReturnType<typeof useAuthSettingsQuery>)
    vi.mocked(useAuditSettingsQuery).mockReturnValue({
      data: { data: {} },
    } as ReturnType<typeof useAuditSettingsQuery>)
    vi.mocked(useGetRobotServerAccessControlSettingsQuery).mockReturnValue({
      data: { data: {} },
    } as ReturnType<typeof useGetRobotServerAccessControlSettingsQuery>)

    render(props)

    fireEvent.click(screen.getByText('Actions requiring admin credentials'))
    expect(screen.getAllByText('Off')).toHaveLength(3)

    fireEvent.click(
      screen.getByText('Require admin credentials to update robots')
    )
    expect(mockPatchAuthSettings).toHaveBeenCalledWith({
      data: { requireAdminCredsWhenUpdatingRobotSoftware: true },
    })
  })
})
