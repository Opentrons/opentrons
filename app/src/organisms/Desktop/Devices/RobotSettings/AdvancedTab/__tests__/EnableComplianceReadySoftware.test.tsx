import { screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { EnableComplianceReadySoftware } from '../EnableComplianceReadySoftware'

vi.mock('@opentrons/react-api-client')

const MOCK_ROBOT_NAME = 'otie'

const mockAccessControlEnabledQuery = (
  value: Partial<ReturnType<typeof useAccessControlEnabledQuery>>
): void => {
  vi.mocked(useAccessControlEnabledQuery).mockReturnValue(
    value as ReturnType<typeof useAccessControlEnabledQuery>
  )
}

const render = ({ isRobotBusy = false }: { isRobotBusy?: boolean } = {}) => {
  return renderWithProviders(
    <EnableComplianceReadySoftware
      isRobotBusy={isRobotBusy}
      robotName={MOCK_ROBOT_NAME}
    />,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings EnableComplianceReadySoftware', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test('should render the title, description, and button copy', () => {
    mockAccessControlEnabledQuery({
      data: { data: { accessControlEnabled: false } },
      isSuccess: true,
    })
    render()
    screen.getByText('Compliance Ready Software')
    screen.getByText(
      'Enable to create unique user logins and create an immutable audit trail of robot actions.'
    )
    screen.getByRole('button', { name: 'Enable CRS' })
  })

  test('CRS unknown: hide the chip and disable the button', () => {
    mockAccessControlEnabledQuery({
      data: undefined,
      isLoading: true,
      isSuccess: false,
    })
    render()
    expect(screen.queryByText('Enabled')).toBeNull()
    expect(screen.queryByText('Disabled')).toBeNull()
    expect(screen.getByRole('button', { name: 'Enable CRS' })).toBeDisabled()
  })

  test('CRS already enabled: show an enabled chip and disable the button', () => {
    mockAccessControlEnabledQuery({
      data: { data: { accessControlEnabled: true } },
      isLoading: false,
      isSuccess: true,
    })
    render()
    screen.getByText('Enabled')
    expect(screen.queryByText('Disabled')).toBeNull()
    expect(screen.getByRole('button', { name: 'Enable CRS' })).toBeDisabled()
  })

  test('CRS not enabled yet: show a disabled chip and enable the button', () => {
    mockAccessControlEnabledQuery({
      data: { data: { accessControlEnabled: false } },
      isLoading: false,
      isSuccess: true,
    })
    render()
    screen.getByText('Disabled')
    expect(screen.queryByText('Enabled')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Enable CRS' })
    ).not.toBeDisabled()
  })

  test('CRS not enabled yet but robot busy: show a disabled chip and disable the button', () => {
    mockAccessControlEnabledQuery({
      data: { data: { accessControlEnabled: false } },
      isLoading: false,
      isSuccess: true,
    })
    render({ isRobotBusy: true })
    screen.getByText('Disabled')
    expect(screen.queryByText('Enabled')).toBeNull()
    expect(screen.getByRole('button', { name: 'Enable CRS' })).toBeDisabled()
  })
})
