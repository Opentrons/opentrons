import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { ChooseProtocolSlideout } from '../../ChooseProtocolSlideout'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { useDispatchApiRequest } from '../../../redux/robot-api'
import { fetchLights } from '../../../redux/robot-controls'
import { useIsRobotBusy, useLights, useRobot } from '../hooks'
import { UpdateRobotBanner } from '../../UpdateRobotBanner'
import { RobotStatusBanner } from '../RobotStatusBanner'
import { RobotOverview } from '../RobotOverview'
import { RobotOverviewOverflowMenu } from '../RobotOverviewOverflowMenu'

import type { DispatchApiRequestType } from '../../../redux/robot-api'

jest.mock('../../../redux/robot-api')
jest.mock('../../../redux/robot-controls')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../hooks')
jest.mock('../RobotStatusBanner')
jest.mock('../../UpdateRobotBanner')
jest.mock('../../ChooseProtocolSlideout')
jest.mock('../RobotOverviewOverflowMenu')

const OT2_PNG_FILE_NAME = 'OT2-R_HERO.png'

const mockUseIsRobotBusy = useIsRobotBusy as jest.MockedFunction<
  typeof useIsRobotBusy
>
const mockUseLights = useLights as jest.MockedFunction<typeof useLights>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockRobotStatusBanner = RobotStatusBanner as jest.MockedFunction<
  typeof RobotStatusBanner
>
const mockChooseProtocolSlideout = ChooseProtocolSlideout as jest.MockedFunction<
  typeof ChooseProtocolSlideout
>
const mockUpdateRobotBanner = UpdateRobotBanner as jest.MockedFunction<
  typeof UpdateRobotBanner
>
const mockRobotOverviewOverflowMenu = RobotOverviewOverflowMenu as jest.MockedFunction<
  typeof RobotOverviewOverflowMenu
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockFetchLights = fetchLights as jest.MockedFunction<typeof fetchLights>

const mockToggleLights = jest.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotOverview robotName="otie" />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotOverview', () => {
  let dispatchApiRequest: DispatchApiRequestType

  beforeEach(() => {
    dispatchApiRequest = jest.fn()
    mockUseIsRobotBusy.mockReturnValue(false)
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
    mockUseLights.mockReturnValue({
      lightsOn: false,
      toggleLights: mockToggleLights,
    })
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockRobotStatusBanner.mockReturnValue(<div>Mock RobotStatusBanner</div>)
    mockChooseProtocolSlideout.mockImplementation(({ showSlideout }) => (
      <div>
        Mock Choose Protocol Slideout {showSlideout ? 'showing' : 'hidden'}
      </div>
    ))
    mockUpdateRobotBanner.mockReturnValue(<div>Mock UpdateRobotBanner</div>)
    mockUseCurrentRunId.mockReturnValue(null)
    mockRobotOverviewOverflowMenu.mockReturnValue(
      <div>mock RobotOverviewOverflowMenu</div>
    )
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders an OT image', () => {
    const [{ getByRole }] = render()
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(OT2_PNG_FILE_NAME)
  })

  it('renders a RobotStatusBanner component', () => {
    const [{ getByText }] = render()
    getByText('Mock RobotStatusBanner')
  })

  it('renders a UpdateRobotBanner component', () => {
    const [{ getByText }] = render()
    getByText('Mock UpdateRobotBanner')
  })

  it('does not render a UpdateRobotBanner component when robot is busy', () => {
    mockUseIsRobotBusy.mockReturnValue(true)
    expect(screen.queryByText('Mock UpdateRobotBanner')).toBeNull()
  })

  it('fetches lights status', () => {
    render()
    expect(dispatchApiRequest).toBeCalledWith(mockFetchLights('otie'))
  })

  it('renders a lights toggle button', () => {
    const [{ getByRole, getByText }] = render()

    getByText('Controls')
    getByText('Lights')
    const toggle = getByRole('switch', { name: 'Lights' })
    toggle.click()
    expect(mockToggleLights).toBeCalled()
  })

  it('renders a Run a Protocol button', () => {
    const [{ getByText }] = render()

    getByText('Run a protocol')
  })

  it('renders a choose protocol slideout hidden by default, expanded after launch', () => {
    const [{ getByText, getByRole }] = render()

    getByText('Mock Choose Protocol Slideout hidden')
    const runButton = getByRole('button', { name: 'Run a protocol' })
    fireEvent.click(runButton)
    getByText('Mock Choose Protocol Slideout showing')
  })

  it('renders an overflow menu for the robot overview', () => {
    const [{ getByText }] = render()

    getByText('mock RobotOverviewOverflowMenu')
  })
})
