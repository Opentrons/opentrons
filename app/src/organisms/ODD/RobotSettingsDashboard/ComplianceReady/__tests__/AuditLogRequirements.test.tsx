import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { AuditLogRequirements } from '../AuditLogRequirements'

import type { ComponentProps } from 'react'
import type {
  AuditSettingsData,
  RobotServerAccessControlSettingsData,
} from '@opentrons/api-client'

vi.mock('/app/atoms/SoftwareKeyboard/NumericalKeyboard', () => ({
  NumericalKeyboard: () => <div>mock numerical keyboard</div>,
}))

const MOCK_AUDIT_SETTINGS: AuditSettingsData = {
  requireReasonForInteraction: true,
  minLengthOfReasonForInteraction: 8,
}

const MOCK_ROBOT_SERVER_SETTINGS: RobotServerAccessControlSettingsData = {
  requireSignoffForProtocolLog: true,
  requireLogsToBeSavedInApp: false,
  deleteOverMaxOnDiskProtocols: false,
}

const render = (props: ComponentProps<typeof AuditLogRequirements>): void => {
  renderWithProviders(<AuditLogRequirements {...props} />, {
    i18nInstance: i18n,
  })
}

describe('AuditLogRequirements', () => {
  let props: ComponentProps<typeof AuditLogRequirements>

  beforeEach(() => {
    props = {
      auditSettings: MOCK_AUDIT_SETTINGS,
      patchAuditSettings: vi.fn(),
      robotServerSettings: MOCK_ROBOT_SERVER_SETTINGS,
      patchRobotServerSettings: vi.fn(),
      onClickBack: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders audit settings with documentation value and toggles', () => {
    render(props)

    screen.getByText('Audit log requirements')
    screen.getByText('Require documentation for robot actions')
    screen.getByText('8 chars')
    screen.getByText('Require signature upon completing a protocol run')
    screen.getByText(
      'Require downloading audit logs in the Opentrons App at the end of a protocol run'
    )
    screen.getByText('When enabled, audit logs will not be saved to the robot')
  })

  it('shows Off when documentation is not required', () => {
    props.auditSettings = {
      requireReasonForInteraction: false,
      minLengthOfReasonForInteraction: 8,
    }
    render(props)

    expect(screen.getAllByText('Off').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('8 chars')).not.toBeInTheDocument()
  })

  it('calls onClickBack from the list page', () => {
    render(props)

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onClickBack).toHaveBeenCalled()
  })

  it('opens documentation settings and returns to the list', () => {
    render(props)

    fireEvent.click(screen.getByText('Require documentation for robot actions'))
    screen.getByText('Preferences')

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    screen.getByText('Audit log requirements')
  })

  it('patches robot server settings when toggles are clicked', () => {
    render(props)

    fireEvent.click(
      screen.getByText('Require signature upon completing a protocol run')
    )
    expect(props.patchRobotServerSettings).toHaveBeenCalledWith({
      requireSignoffForProtocolLog: false,
    })

    fireEvent.click(
      screen.getByText(
        'Require downloading audit logs in the Opentrons App at the end of a protocol run'
      )
    )
    expect(props.patchRobotServerSettings).toHaveBeenCalledWith({
      requireLogsToBeSavedInApp: true,
    })
  })

  it('treats missing audit and robot server setting keys as off and toggles them on', () => {
    props.auditSettings = {}
    props.robotServerSettings = {}
    render(props)

    expect(screen.queryByText('8 chars')).not.toBeInTheDocument()
    expect(screen.getAllByText('Off')).toHaveLength(3)

    fireEvent.click(
      screen.getByText('Require signature upon completing a protocol run')
    )
    expect(props.patchRobotServerSettings).toHaveBeenCalledWith({
      requireSignoffForProtocolLog: true,
    })

    fireEvent.click(
      screen.getByText(
        'Require downloading audit logs in the Opentrons App at the end of a protocol run'
      )
    )
    expect(props.patchRobotServerSettings).toHaveBeenCalledWith({
      requireLogsToBeSavedInApp: true,
    })
  })
})
