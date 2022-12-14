import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import {
  mockOT2HealthResponse,
  mockOT2ServerHealthResponse,
  mockOT3HealthResponse,
  mockOT3ServerHealthResponse,
} from '@opentrons/discovery-client/src/__fixtures__'

import { AvailableRobotOption } from '../AvailableRobotOption'
import { i18n } from '../../../i18n'
import { getRobotModelByName } from '../../../redux/discovery'
import {
  HEALTH_STATUS_OK,
  ROBOT_MODEL_OT2,
  ROBOT_MODEL_OT3,
} from '../../../redux/discovery/constants'

import type { State } from '../../../redux/types'

jest.mock('../../../redux/discovery/selectors')

const robotName = 'fakeRobotName'
const robotModel = 'OT-2'
const OT2_PNG_FILE_NAME = 'OT2-R_HERO.png'
const OT3_PNG_FILE_NAME = 'OT3.png'
const MOCK_STATE: State = {
  discovery: {
    robot: { connection: { connectedTo: null } },
    robotsByName: {
      otie: {
        name: 'fakeRobotName',
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

const mockGetRobotModelByName = getRobotModelByName as jest.MockedFunction<
  typeof getRobotModelByName
>

describe('AvailableRobotOption', () => {
  beforeEach(() => {
    when(mockGetRobotModelByName)
      .calledWith(MOCK_STATE, robotName)
      .mockReturnValue('OT-2')
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders slideout if showSlideout true', () => {
    const { queryByText } = renderWithProviders(
      <AvailableRobotOption
        robotName={robotName}
        local={false}
        onClick={jest.fn()}
        isSelected={false}
        isError={false}
        isOnDifferentSoftwareVersion={false}
      />,
      {
        i18nInstance: i18n,
        initialState: MOCK_STATE,
      }
    )[0]
    expect(queryByText(robotModel)).toBeInTheDocument()
    expect(queryByText(robotName)).toBeInTheDocument()
  })
  it('renders usb icon if local', () => {
    const { queryByLabelText } = renderWithProviders(
      <AvailableRobotOption
        robotName={robotName}
        local={true}
        onClick={jest.fn()}
        isSelected={false}
        isError={false}
        isOnDifferentSoftwareVersion={false}
      />,
      {
        i18nInstance: i18n,
        initialState: MOCK_STATE,
      }
    )[0]
    expect(queryByLabelText('usb')).toBeInTheDocument()
  })
  it('renders wifi icon if not local', () => {
    const { queryByLabelText } = renderWithProviders(
      <AvailableRobotOption
        robotName={robotName}
        local={false}
        onClick={jest.fn()}
        isSelected={false}
        isError={false}
        isOnDifferentSoftwareVersion={false}
      />,
      {
        i18nInstance: i18n,
        initialState: MOCK_STATE,
      }
    )[0]
    expect(queryByLabelText('wifi')).toBeInTheDocument()
  })
  it('calls onClick prop when clicked', () => {
    const handleClick = jest.fn()

    const { container } = renderWithProviders(
      <AvailableRobotOption
        robotName={robotName}
        local={false}
        onClick={handleClick()}
        isSelected={false}
        isError={false}
        isOnDifferentSoftwareVersion={false}
      />,
      {
        i18nInstance: i18n,
        initialState: MOCK_STATE,
      }
    )[0]
    fireEvent.click(container)
    expect(handleClick).toHaveBeenCalled()
  })
  it('renders OT-2 image and the correct robot model  when the robot model is OT-2', () => {
    const { getByText, getByRole } = renderWithProviders(
      <AvailableRobotOption
        robotName={robotName}
        local={false}
        onClick={jest.fn()}
        isSelected={false}
        isError={false}
        isOnDifferentSoftwareVersion={false}
      />,
      {
        i18nInstance: i18n,
        initialState: MOCK_STATE,
      }
    )[0]
    getByText('OT-2')
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(OT2_PNG_FILE_NAME)
  })
  it('renders OT-3 image and the correct robot model when the robot model is OT-3', () => {
    const ot3RobotName = 'buzz'
    when(mockGetRobotModelByName)
      .calledWith(MOCK_STATE, ot3RobotName)
      .mockReturnValue('OT-3')
    const { getByText, getByRole } = renderWithProviders(
      <AvailableRobotOption
        robotName={ot3RobotName}
        local={false}
        onClick={jest.fn()}
        isSelected={false}
        isError={false}
        isOnDifferentSoftwareVersion={false}
      />,
      {
        i18nInstance: i18n,
        initialState: MOCK_STATE,
      }
    )[0]
    getByText('OT-3')
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(OT3_PNG_FILE_NAME)
  })
  it('renders link to device details if software version is out of sync with app and is selected', () => {
    const handleClick = jest.fn()

    const { getByText } = renderWithProviders(
      <StaticRouter>
        <AvailableRobotOption
          robotName={robotName}
          local={false}
          onClick={handleClick()}
          isSelected={true}
          isError={false}
          isOnDifferentSoftwareVersion={true}
        />
      </StaticRouter>,
      {
        i18nInstance: i18n,
      }
    )[0]
    expect(
      getByText(
        'A software update is available for this robot. Update to run protocols.'
      )
    ).toBeInTheDocument()
  })
  it('does not render link to device details if software version is out of sync with app and is not selected', () => {
    const handleClick = jest.fn()

    const { queryByText } = renderWithProviders(
      <StaticRouter>
        <AvailableRobotOption
          robotName={robotName}
          local={false}
          onClick={handleClick()}
          isSelected={false}
          isOnDifferentSoftwareVersion={true}
        />
      </StaticRouter>,
      {
        i18nInstance: i18n,
      }
    )[0]
    expect(
      queryByText(
        'A software update is available for this robot. Update to run protocols.'
      )
    ).toBeNull()
  })
})
