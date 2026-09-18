import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'

import { ComplianceReadySoftwareFiles } from '../ComplianceReadySoftwareFiles'
import { DiagnosticsFiles } from '../DiagnosticFiles'
import { RobotSettingsFileManager } from '../index'
import { ProtocolRunRecords } from '../ProtocolRunRecords'
import { RobotStorage } from '../RobotStorage'

vi.mock('@opentrons/react-api-client')
vi.mock('../RobotStorage')
vi.mock('../ProtocolRunRecords')
vi.mock('../ComplianceReadySoftwareFiles')
vi.mock('../DiagnosticFiles')

const ROBOT_NAME = 'otie'

const render = () =>
  renderWithProviders(<RobotSettingsFileManager robotName={ROBOT_NAME} />)

describe('RobotSettingsFileManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(RobotStorage).mockReturnValue(<div>mock robot storage</div>)
    vi.mocked(ProtocolRunRecords).mockReturnValue(
      <div>mock protocol run records</div>
    )
    vi.mocked(ComplianceReadySoftwareFiles).mockReturnValue(
      <div>mock compliance ready software files</div>
    )
    vi.mocked(DiagnosticsFiles).mockReturnValue(
      <div>mock diagnostics files</div>
    )
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
    } as any)
  })

  it('renders robot storage', () => {
    render()
    screen.getByText('mock robot storage')
  })

  it('renders diagnostics files', () => {
    render()
    screen.getByText('mock diagnostics files')
  })

  it('renders compliance ready software files if access control is enabled', () => {
    render()
    screen.getByText('mock compliance ready software files')
  })

  it('does not render compliance ready software files if access control is not enabled', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: false } },
    } as any)
    render()
    expect(
      screen.queryByText('mock compliance ready software files')
    ).not.toBeInTheDocument()
  })

  it('renders protocol run records', () => {
    render()
    screen.getByText('mock protocol run records')
  })
})
