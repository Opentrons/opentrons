import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  getRobotSerialNumber,
  getRobotFirmwareVersion,
  getRobotProtocolApiVersion,
} from '/app/redux/discovery'
import { useRobot } from '/app/redux-resources/robots'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import { RobotInformation } from '../RobotInformation'

vi.mock('/app/redux-resources/robots')
vi.mock('/app/redux/discovery/selectors')

const MOCK_ROBOT_SERIAL_NUMBER = '0.0.0'
const MOCK_FIRMWARE_VERSION = '4.5.6'
const MOCK_MIN_PAPI_VERSION = '0.0'
const MOCK_MAX_PAPI_VERSION = '5.1'

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotInformation robotName="otie" />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings RobotInformation', () => {
  beforeEach(() => {
    vi.mocked(useRobot).mockReturnValue(mockConnectableRobot)
    vi.mocked(getRobotSerialNumber).mockReturnValue(MOCK_ROBOT_SERIAL_NUMBER)
    vi.mocked(getRobotFirmwareVersion).mockReturnValue(MOCK_FIRMWARE_VERSION)
    vi.mocked(getRobotProtocolApiVersion).mockReturnValue({
      min: MOCK_MIN_PAPI_VERSION,
      max: MOCK_MAX_PAPI_VERSION,
    })
  })

  it('should render item title', () => {
    render()
    screen.getByText('Robot Serial Number')
    screen.getByText('Firmware Version')
    screen.getByText('Supported Protocol API Versions')
  })

  it('should not render serial number, firmware version and supported protocol api versions', () => {
    render()
    screen.getByText('0.0.0')
    screen.getByText('4.5.6')
    screen.getByText('v0.0 - v5.1')
  })

  it('should not render serial number, firmware version and supported protocol api versions without ViewableRobot', () => {
    vi.mocked(useRobot).mockReturnValue(null)
    render()
    expect(screen.queryByText('0.0.0')).not.toBeInTheDocument()
    expect(screen.queryByText('4.5.6')).not.toBeInTheDocument()
    expect(screen.queryByText('v0.0 - v5.1')).not.toBeInTheDocument()
  })

  it('should render only one version when min supported protocol version and max supported protocol version are equal', () => {
    vi.mocked(getRobotProtocolApiVersion).mockReturnValue({
      min: '2.15',
      max: '2.15',
    })
    render()
    screen.getByText('v2.15')
    expect(screen.queryByText('v2.15 - v2.15')).not.toBeInTheDocument()
  })
})
