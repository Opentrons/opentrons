import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { RUN_STATUS_RUNNING } from '@opentrons/api-client'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import {
  mockOT2HealthResponse,
  mockOT2ServerHealthResponse,
  mockOT3HealthResponse,
  mockOT3ServerHealthResponse,
} from '@opentrons/discovery-client/src/__fixtures__'

import { i18n } from '../../../i18n'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../redux/modules/__fixtures__'
import {
  mockLeftProtoPipette,
  mockRightProtoPipette,
} from '../../../redux/pipettes/__fixtures__'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { getBuildrootUpdateDisplayInfo } from '../../../redux/buildroot'
import { getRobotModelByName } from '../../../redux/discovery'
import {
  HEALTH_STATUS_OK,
  ROBOT_MODEL_OT2,
  ROBOT_MODEL_OT3,
} from '../../../redux/discovery/constants'
import {
  useAttachedModules,
  useAttachedPipettes,
  useProtocolDetailsForRun,
} from '../hooks'
import { useFeatureFlag } from '../../../redux/config'
import { useCurrentRunId } from '../../../organisms/ProtocolUpload/hooks'
import { useCurrentRunStatus } from '../../../organisms/RunTimeControl/hooks'
import { ChooseProtocolSlideout } from '../../ChooseProtocolSlideout'
import { UpdateRobotBanner } from '../../UpdateRobotBanner'
import { RobotCard } from '../RobotCard'

import type { ProtocolAnalysisFile } from '@opentrons/shared-data'
import type { State } from '../../../redux/types'

jest.mock('../../../redux/buildroot/selectors')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../../../organisms/ProtocolUpload/hooks')
jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../hooks')
jest.mock('../../UpdateRobotBanner')
jest.mock('../../ChooseProtocolSlideout')
jest.mock('../../../redux/config')

const OT2_PNG_FILE_NAME = 'OT2-R_HERO.png'
const OT3_PNG_FILE_NAME = 'OT3.png'
const MOCK_STATE: State = {
  discovery: {
    robot: { connection: { connectedTo: null } },
    robotsByName: {
      'opentrons-robot-name': {
        name: 'opentrons-robot-name',
        health: mockOT2HealthResponse,
        serverHealth: mockOT2ServerHealthResponse,
        addresses: [
          {
            ip: '10.0.0.3',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: null,
            serverHealthError: null,
            advertisedModel: ROBOT_MODEL_OT2,
          },
        ],
      },
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

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseCurrentRunStatus = useCurrentRunStatus as jest.MockedFunction<
  typeof useCurrentRunStatus
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockChooseProtocolSlideout = ChooseProtocolSlideout as jest.MockedFunction<
  typeof ChooseProtocolSlideout
>
const mockUpdateRobotBanner = UpdateRobotBanner as jest.MockedFunction<
  typeof UpdateRobotBanner
>
const mockGetBuildrootUpdateDisplayInfo = getBuildrootUpdateDisplayInfo as jest.MockedFunction<
  typeof getBuildrootUpdateDisplayInfo
>
const mockGetRobotModelByName = getRobotModelByName as jest.MockedFunction<
  typeof getRobotModelByName
>
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolAnalysisFile<{}>
const PROTOCOL_DETAILS = {
  displayName: 'Testosaur',
  protocolData: simpleV6Protocol,
  protocolKey: 'fakeProtocolKey',
  robotType: 'OT-2 Standard' as const,
}

const render = (props: React.ComponentProps<typeof RobotCard>) => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotCard {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
      initialState: MOCK_STATE,
    }
  )
}

describe('RobotCard', () => {
  let props: React.ComponentProps<typeof RobotCard>

  beforeEach(() => {
    props = { robot: mockConnectableRobot }
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseAttachedModules.mockReturnValue(
      mockFetchModulesSuccessActionPayloadModules
    )
    mockUseAttachedPipettes.mockReturnValue({
      left: mockLeftProtoPipette,
      right: mockRightProtoPipette,
    })
    mockChooseProtocolSlideout.mockImplementation(({ showSlideout }) => (
      <div>
        Mock Choose Protocol Slideout {showSlideout ? 'showing' : 'hidden'}
      </div>
    ))
    mockUpdateRobotBanner.mockReturnValue(<div>Mock UpdateRobotBanner</div>)
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    when(mockUseCurrentRunId).calledWith().mockReturnValue(null)
    when(mockUseCurrentRunStatus).calledWith().mockReturnValue(null)
    when(mockUseProtocolDetailsForRun)
      .calledWith(null)
      .mockReturnValue({
        displayName: null,
        protocolData: {} as ProtocolAnalysisFile<{}>,
        protocolKey: null,
        robotType: 'OT-2 Standard',
      })
    when(mockGetRobotModelByName)
      .calledWith(MOCK_STATE, mockConnectableRobot.name)
      .mockReturnValue('OT-2')
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders an OT-2 image when robot model is OT-2', () => {
    const [{ getByRole }] = render(props)
    const image = getByRole('img')

    expect(image.getAttribute('src')).toEqual(OT2_PNG_FILE_NAME)
  })

  it('renders an OT-3 image when robot model is OT-3', () => {
    props = { robot: { ...mockConnectableRobot, name: 'buzz' } }
    when(mockGetRobotModelByName)
      .calledWith(MOCK_STATE, 'buzz')
      .mockReturnValue('OT-3')
    const [{ getByRole }] = render(props)
    const image = getByRole('img')

    expect(image.getAttribute('src')).toEqual(OT3_PNG_FILE_NAME)
  })

  it('renders a UpdateRobotBanner component', () => {
    const [{ getByText }] = render(props)
    getByText('Mock UpdateRobotBanner')
  })

  it('renders the type of pipettes attached to left and right mounts', () => {
    const [{ getByText }] = render(props)

    getByText('Left Mount')
    getByText('Left Pipette')
    getByText('Right Mount')
    getByText('Right Pipette')
  })

  it('renders a modules section', () => {
    const [{ getByText }] = render(props)

    getByText('Modules')
  })

  it('renders the model of robot and robot name - OT-2', () => {
    const [{ getByText }] = render(props)
    getByText('OT-2')
    getByText(mockConnectableRobot.name)
  })

  it('renders the model of robot and robot name - OT-3', () => {
    props = { robot: { ...mockConnectableRobot, name: 'buzz' } }
    when(mockGetRobotModelByName)
      .calledWith(MOCK_STATE, 'buzz')
      .mockReturnValue('OT-3')
    const [{ getByText }] = render(props)
    getByText('OT-3')
    getByText('buzz')
  })

  it('does not render a running protocol banner when a protocol is not running', () => {
    const [{ queryByText }] = render(props)

    expect(queryByText('Testosaur;')).toBeFalsy()
    expect(queryByText('Go to Run')).toBeFalsy()
  })

  it('renders a running protocol banner when a protocol is running', () => {
    when(mockUseCurrentRunId).calledWith().mockReturnValue('1')
    when(mockUseCurrentRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_RUNNING)
    when(mockUseProtocolDetailsForRun)
      .calledWith('1')
      .mockReturnValue(PROTOCOL_DETAILS)

    const [{ getByRole, getByText }] = render(props)

    getByText('Testosaur; Running')

    const runLink = getByRole('link', { name: 'Go to Run' })
    expect(runLink.getAttribute('href')).toEqual(
      '/devices/opentrons-robot-name/protocol-runs/1/run-log'
    )
  })
})
