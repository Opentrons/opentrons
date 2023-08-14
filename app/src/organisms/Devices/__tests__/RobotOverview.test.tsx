import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import {
  mockOT3HealthResponse,
  mockOT3ServerHealthResponse,
} from '@opentrons/discovery-client/src/__fixtures__'
import { useAuthorization } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { getRobotUpdateDisplayInfo } from '../../../redux/robot-update'
import { getConfig, useFeatureFlag } from '../../../redux/config'
import {
  getRobotAddressesByName,
  getRobotModelByName,
} from '../../../redux/discovery'
import {
  HEALTH_STATUS_OK,
  OPENTRONS_USB,
  ROBOT_MODEL_OT3,
} from '../../../redux/discovery/constants'
import {
  useCalibrationTaskList,
  useIsRobotBusy,
  useLights,
  useRobot,
  useRunStatuses,
} from '../hooks'
import {
  expectedBadDeckTaskList,
  expectedBadDeckAndPipetteOffsetTaskList,
  expectedBadEverythingTaskList,
  expectedBadPipetteOffsetTaskList,
  expectedBadTipLengthTaskList,
  expectedBadTipLengthAndOffsetTaskList,
  expectedIncompleteDeckCalTaskList,
  expectedTaskList,
} from '../hooks/__fixtures__/taskListFixtures'
import { UpdateRobotBanner } from '../../UpdateRobotBanner'
import { RobotStatusHeader } from '../RobotStatusHeader'
import { RobotOverview } from '../RobotOverview'
import { RobotOverviewOverflowMenu } from '../RobotOverviewOverflowMenu'

import type { Config } from '../../../redux/config/types'
import type { DiscoveryClientRobotAddress } from '../../../redux/discovery/types'
import type { State } from '../../../redux/types'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../redux/robot-controls')
jest.mock('../../../redux/robot-update/selectors')
jest.mock('../../../redux/config')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../hooks')
jest.mock('../RobotStatusHeader')
jest.mock('../../UpdateRobotBanner')
jest.mock('../RobotOverviewOverflowMenu')

const OT2_PNG_FILE_NAME = 'OT2-R_HERO.png'
const FLEX_PNG_FILE_NAME = 'FLEX.png'

const MOCK_STATE: State = {
  discovery: {
    robot: { connection: { connectedTo: null } },
    robotsByName: {
      [mockConnectableRobot.name]: mockConnectableRobot,
      buzz: {
        name: 'buzz',
        health: mockOT3HealthResponse,
        serverHealth: mockOT3ServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.4',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: null,
            serverHealthError: null,
            advertisedModel: ROBOT_MODEL_OT3,
          },
        ],
      },
    },
  },
} as any

const mockUseCalibrationTaskList = useCalibrationTaskList as jest.MockedFunction<
  typeof useCalibrationTaskList
>
const mockUseIsRobotBusy = useIsRobotBusy as jest.MockedFunction<
  typeof useIsRobotBusy
>
const mockUseLights = useLights as jest.MockedFunction<typeof useLights>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
const mockRobotStatusHeader = RobotStatusHeader as jest.MockedFunction<
  typeof RobotStatusHeader
>
const mockUpdateRobotBanner = UpdateRobotBanner as jest.MockedFunction<
  typeof UpdateRobotBanner
>
const mockRobotOverviewOverflowMenu = RobotOverviewOverflowMenu as jest.MockedFunction<
  typeof RobotOverviewOverflowMenu
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>
const mockGetBuildrootUpdateDisplayInfo = getRobotUpdateDisplayInfo as jest.MockedFunction<
  typeof getRobotUpdateDisplayInfo
>
const mockGetRobotModelByName = getRobotModelByName as jest.MockedFunction<
  typeof getRobotModelByName
>
const mockGetRobotAddressesByName = getRobotAddressesByName as jest.MockedFunction<
  typeof getRobotAddressesByName
>

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>

const mockUseAuthorization = useAuthorization as jest.MockedFunction<
  typeof useAuthorization
>

const mockToggleLights = jest.fn()

const render = (props: React.ComponentProps<typeof RobotOverview>) => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotOverview robotName={props.robotName} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
      initialState: MOCK_STATE,
    }
  )
}

describe('RobotOverview', () => {
  let props: React.ComponentProps<typeof RobotOverview>

  beforeEach(() => {
    props = { robotName: mockConnectableRobot.name }
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: true,
      isRunIdle: false,
    })
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    mockUseCalibrationTaskList.mockReturnValue(expectedTaskList)
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseIsRobotBusy.mockReturnValue(false)
    mockUseLights.mockReturnValue({
      lightsOn: false,
      toggleLights: mockToggleLights,
    })
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockRobotStatusHeader.mockReturnValue(<div>Mock RobotStatusHeader</div>)
    mockUpdateRobotBanner.mockReturnValue(<div>Mock UpdateRobotBanner</div>)
    mockUseCurrentRunId.mockReturnValue(null)
    mockRobotOverviewOverflowMenu.mockReturnValue(
      <div>mock RobotOverviewOverflowMenu</div>
    )
    when(mockGetRobotModelByName)
      .calledWith(MOCK_STATE, mockConnectableRobot.name)
      .mockReturnValue('OT-2')
    when(mockGetRobotAddressesByName)
      .calledWith(MOCK_STATE, mockConnectableRobot.name)
      .mockReturnValue([])
    when(mockGetConfig)
      .calledWith(MOCK_STATE)
      .mockReturnValue({
        support: { userId: 'opentrons-robot-user' },
      } as Config)
    when(mockUseAuthorization)
      .calledWith({
        subject: 'Opentrons',
        agent: 'com.opentrons.app',
        agentId: 'opentrons-robot-user',
      })
      .mockReturnValue({
        authorizationToken: { token: 'my.authorization.jwt' },
        registrationToken: { token: 'my.registration.jwt' },
      })
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders an OT-2 image', () => {
    const [{ getByRole }] = render(props)
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(OT2_PNG_FILE_NAME)
  })

  it('renders an OT-3 image', () => {
    when(mockGetRobotModelByName)
      .calledWith(MOCK_STATE, mockConnectableRobot.name)
      .mockReturnValue('Opentrons Flex')
    const [{ getByRole }] = render(props)
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(FLEX_PNG_FILE_NAME)
  })

  it('renders a RobotStatusHeader component', () => {
    const [{ getByText }] = render(props)
    getByText('Mock RobotStatusHeader')
  })

  it('renders a UpdateRobotBanner component', () => {
    const [{ getByText }] = render(props)
    getByText('Mock UpdateRobotBanner')
  })

  it('does not render a calibration status label when calibration is good and the calibration wizard feature flag is set', () => {
    mockUseFeatureFlag.mockReturnValue(true)
    const [{ queryByRole }] = render(props)
    expect(
      queryByRole('link', {
        name: 'Go to calibration',
      })
    ).not.toBeInTheDocument()
  })

  it('renders a missing calibration status label when the calibration wizard feature flag is set', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedIncompleteDeckCalTaskList
    )
    mockUseFeatureFlag.mockReturnValue(true)
    const [{ getByRole, getByText }] = render(props)
    getByText('Robot is missing calibration data')
    const calibrationDashboardLink = getByRole('link', {
      name: 'Go to calibration',
    })
    expect(calibrationDashboardLink.getAttribute('href')).toEqual(
      '/devices/opentrons-robot-name/robot-settings/calibration'
    )
  })

  it('renders a recommended recalibration status label when the deck is bad and calibration wizard feature flag is set', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedBadDeckTaskList)
    mockUseFeatureFlag.mockReturnValue(true)
    const [{ getByRole, getByText }] = render(props)
    getByText('Recalibration recommended')
    const calibrationDashboardLink = getByRole('link', {
      name: 'Go to calibration',
    })
    expect(calibrationDashboardLink.getAttribute('href')).toEqual(
      '/devices/opentrons-robot-name/robot-settings/calibration'
    )
  })

  it('renders a recommended recalibration status label when both the deck and offset is bad and the calibration wizard feature flag is set', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedBadDeckAndPipetteOffsetTaskList
    )
    mockUseFeatureFlag.mockReturnValue(true)
    const [{ getByRole, getByText }] = render(props)
    getByText('Recalibration recommended')
    const calibrationDashboardLink = getByRole('link', {
      name: 'Go to calibration',
    })
    expect(calibrationDashboardLink.getAttribute('href')).toEqual(
      '/devices/opentrons-robot-name/robot-settings/calibration'
    )
  })

  it('renders a recommended recalibration status label when everything is bad and the calibration wizard feature flag is set', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedBadEverythingTaskList)
    mockUseFeatureFlag.mockReturnValue(true)
    const [{ getByRole, getByText }] = render(props)
    getByText('Recalibration recommended')
    const calibrationDashboardLink = getByRole('link', {
      name: 'Go to calibration',
    })
    expect(calibrationDashboardLink.getAttribute('href')).toEqual(
      '/devices/opentrons-robot-name/robot-settings/calibration'
    )
  })

  it('renders a recommended recalibration status label when the offset is bad and calibration wizard feature flag is set', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedBadPipetteOffsetTaskList)
    mockUseFeatureFlag.mockReturnValue(true)
    const [{ getByRole, getByText }] = render(props)
    getByText('Recalibration recommended')
    const calibrationDashboardLink = getByRole('link', {
      name: 'Go to calibration',
    })
    expect(calibrationDashboardLink.getAttribute('href')).toEqual(
      '/devices/opentrons-robot-name/robot-settings/calibration'
    )
  })

  it('renders a recommended recalibration status label when the tip length is bad and calibration wizard feature flag is set', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedBadTipLengthTaskList)
    mockUseFeatureFlag.mockReturnValue(true)
    const [{ getByRole, getByText }] = render(props)
    getByText('Recalibration recommended')
    const calibrationDashboardLink = getByRole('link', {
      name: 'Go to calibration',
    })
    expect(calibrationDashboardLink.getAttribute('href')).toEqual(
      '/devices/opentrons-robot-name/robot-settings/calibration'
    )
  })

  it('renders a recommended recalibration status label when both the tip length and offset is bad and the calibration wizard feature flag is set', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedBadTipLengthAndOffsetTaskList
    )
    mockUseFeatureFlag.mockReturnValue(true)
    const [{ getByRole, getByText }] = render(props)
    getByText('Recalibration recommended')
    const calibrationDashboardLink = getByRole('link', {
      name: 'Go to calibration',
    })
    expect(calibrationDashboardLink.getAttribute('href')).toEqual(
      '/devices/opentrons-robot-name/robot-settings/calibration'
    )
  })

  it('does not render a calibration status label when robot is busy and the calibration wizard feature flag is set', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedIncompleteDeckCalTaskList
    )
    mockUseIsRobotBusy.mockReturnValue(true)
    mockUseFeatureFlag.mockReturnValue(true)
    const [{ queryByRole }] = render(props)
    expect(
      queryByRole('link', {
        name: 'Go to calibration',
      })
    ).not.toBeInTheDocument()
  })

  it('fetches lights status', async () => {
    mockUseLights.mockReturnValue({
      lightsOn: true,
      toggleLights: mockToggleLights,
    })
    const [{ getByRole }] = render(props)
    const toggle = getByRole('switch', { name: 'Lights' })
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })

  it('renders a lights toggle button', () => {
    const [{ getByRole, getByText }] = render(props)

    getByText('Controls')
    getByText('Lights')
    const toggle = getByRole('switch', { name: 'Lights' })
    toggle.click()
    expect(mockToggleLights).toBeCalled()
  })

  it('renders an overflow menu for the robot overview', () => {
    const [{ getByText }] = render(props)

    getByText('mock RobotOverviewOverflowMenu')
  })

  it('requests a usb registration token if connected by usb', () => {
    when(mockGetRobotAddressesByName)
      .calledWith(MOCK_STATE, mockConnectableRobot.name)
      .mockReturnValue([{ ip: OPENTRONS_USB } as DiscoveryClientRobotAddress])
    render(props)
    expect(mockUseAuthorization).toBeCalledWith({
      subject: 'Opentrons',
      agent: 'com.opentrons.app.usb',
      agentId: 'opentrons-robot-user',
    })
  })
})
