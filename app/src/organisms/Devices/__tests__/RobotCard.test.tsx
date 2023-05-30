import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
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
import { useAttachedModules, useAttachedPipettes } from '../hooks'
import { UpdateRobotBanner } from '../../UpdateRobotBanner'
import { RobotOverflowMenu } from '../RobotOverflowMenu'
import { RobotStatusHeader } from '../RobotStatusHeader'
import { RobotCard } from '../RobotCard'

import type { State } from '../../../redux/types'

jest.mock('../../../redux/buildroot/selectors')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../hooks')
jest.mock('../../UpdateRobotBanner')
jest.mock('../../../redux/config')
jest.mock('../RobotOverflowMenu')
jest.mock('../RobotStatusHeader')

const OT2_PNG_FILE_NAME = 'OT2-R_HERO.png'
const FLEX_PNG_FILE_NAME = 'FLEX.png'
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

const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockUpdateRobotBanner = UpdateRobotBanner as jest.MockedFunction<
  typeof UpdateRobotBanner
>
const mockRobotOverflowMenu = RobotOverflowMenu as jest.MockedFunction<
  typeof RobotOverflowMenu
>
const mockRobotStatusHeader = RobotStatusHeader as jest.MockedFunction<
  typeof RobotStatusHeader
>
const mockGetBuildrootUpdateDisplayInfo = getBuildrootUpdateDisplayInfo as jest.MockedFunction<
  typeof getBuildrootUpdateDisplayInfo
>
const mockGetRobotModelByName = getRobotModelByName as jest.MockedFunction<
  typeof getRobotModelByName
>

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
    mockUseAttachedModules.mockReturnValue(
      mockFetchModulesSuccessActionPayloadModules
    )
    mockUseAttachedPipettes.mockReturnValue({
      left: mockLeftProtoPipette,
      right: mockRightProtoPipette,
    })
    mockUpdateRobotBanner.mockReturnValue(<div>Mock UpdateRobotBanner</div>)
    mockRobotOverflowMenu.mockReturnValue(<div>Mock RobotOverflowMenu</div>)
    mockRobotStatusHeader.mockReturnValue(<div>Mock RobotStatusHeader</div>)
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
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
      .mockReturnValue('Opentrons Flex')
    const [{ getByRole }] = render(props)
    const image = getByRole('img')

    expect(image.getAttribute('src')).toEqual(FLEX_PNG_FILE_NAME)
  })

  it('renders a UpdateRobotBanner component', () => {
    const [{ getByText }] = render(props)
    getByText('Mock UpdateRobotBanner')
  })

  it('renders a RobotOverflowMenu component', () => {
    const [{ getByText }] = render(props)
    getByText('Mock RobotOverflowMenu')
  })

  it('renders a RobotStatusHeader component', () => {
    const [{ getByText }] = render(props)
    getByText('Mock RobotStatusHeader')
  })

  it('renders loading text while loading instruments', () => {
    const [{ getByText }] = render(props)

    getByText('instruments')
    getByText('LOADING')
  })
})
