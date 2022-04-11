import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useCurrentRunId } from '../../../organisms/ProtocolUpload/hooks'
import {ChooseProtocolSlideout} from '../../../organisms/ChooseProtocolSlideout'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { useLights, useRobot, useIsRobotViewable } from '../hooks'
import { RobotStatusBanner } from '../RobotStatusBanner'
import { RobotOverview } from '../RobotOverview'

jest.mock('../../ProtocolUpload/hooks')
jest.mock('../hooks')
jest.mock('../RobotStatusBanner')
jest.mock('../../../organisms/ChooseProtocolSlideout')

const OT2_PNG_FILE_NAME = 'OT2-R_HERO.png'

const mockUseLights = useLights as jest.MockedFunction<typeof useLights>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockUseIsRobotViewable = useIsRobotViewable as jest.MockedFunction<typeof useIsRobotViewable>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockRobotStatusBanner = RobotStatusBanner as jest.MockedFunction<
  typeof RobotStatusBanner
>
const mockChooseProtocolSlideout = ChooseProtocolSlideout as jest.MockedFunction<
  typeof ChooseProtocolSlideout
>

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
  beforeEach(() => {
    mockUseLights.mockReturnValue({
      lightsOn: false,
      toggleLights: mockToggleLights,
    })
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockRobotStatusBanner.mockReturnValue(<div>Mock RobotStatusBanner</div>)
    mockChooseProtocolSlideout.mockImplementation(({showSlideout}) => <div>Mock Choose Protocol Slideout {showSlideout ? 'showing' : 'hidden'}</div>)
    mockUseCurrentRunId.mockReturnValue(null)
    mockUseIsRobotViewable.mockReturnValue(true)
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

    getByText('Run a Protocol')
  })

  it('renders a choose protocol slideout hidden by default, expanded after launch', () => {
    const [{ getByText, getByRole }] = render()

    getByText('Mock Choose Protocol Slideout hidden')
    const runButton = getByRole('button', {name: 'Run a Protocol'})
    fireEvent.click(runButton)
    getByText('Mock Choose Protocol Slideout showing')
  })
})
