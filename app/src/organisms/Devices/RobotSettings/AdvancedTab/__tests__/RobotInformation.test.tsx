import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import {
  getRobotSerialNumber,
  getRobotFirmwareVersion,
  getRobotProtocolApiVersion,
} from '../../../../../redux/discovery'
import { useRobot } from '../../../hooks'
import { mockConnectableRobot } from '../../../../../redux/discovery/__fixtures__'
import { RobotInformation } from '../RobotInformation'

jest.mock('../../../hooks')
jest.mock('../../../../../redux/discovery/selectors')

const mockGetRobotSerialNumber = getRobotSerialNumber as jest.MockedFunction<
  typeof getRobotSerialNumber
>
const mockGetRobotFirmwareVersion = getRobotFirmwareVersion as jest.MockedFunction<
  typeof getRobotFirmwareVersion
>
const mockGetRobotProtocolApiVersion = getRobotProtocolApiVersion as jest.MockedFunction<
  typeof getRobotProtocolApiVersion
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>

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
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockGetRobotSerialNumber.mockReturnValue(MOCK_ROBOT_SERIAL_NUMBER)
    mockGetRobotFirmwareVersion.mockReturnValue(MOCK_FIRMWARE_VERSION)
    mockGetRobotProtocolApiVersion.mockReturnValue({
      min: MOCK_MIN_PAPI_VERSION,
      max: MOCK_MAX_PAPI_VERSION,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render item title', () => {
    const [{ getByText }] = render()
    getByText('Robot Serial Number')
    getByText('Firmware Version')
    getByText('Supported Protocol API Versions')
  })

  it('should not render serial number, firmware version and supported protocol api versions', () => {
    const [{ getByText }] = render()
    getByText('0.0.0')
    getByText('4.5.6')
    getByText('v0.0 - v5.1')
  })

  it('should not render serial number, firmware version and supported protocol api versions without ViewableRobot', () => {
    mockUseRobot.mockReturnValue(null)
    const [{ queryByText }] = render()
    expect(queryByText('0.0.0')).not.toBeInTheDocument()
    expect(queryByText('4.5.6')).not.toBeInTheDocument()
    expect(queryByText('v0.0 - v5.1')).not.toBeInTheDocument()
  })

  it('should render only one version when min supported protocol version and max supported protocol version are equal', () => {
    mockGetRobotProtocolApiVersion.mockReturnValue({
      min: '2.15',
      max: '2.15',
    })
    const [{ getByText, queryByText }] = render()
    getByText('v2.15')
    expect(queryByText('v2.15 - v2.15')).not.toBeInTheDocument()
  })
})
