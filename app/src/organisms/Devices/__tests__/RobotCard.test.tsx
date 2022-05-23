import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../redux/modules/__fixtures__'
import {
  mockLeftProtoPipette,
  mockRightProtoPipette,
} from '../../../redux/pipettes/__fixtures__'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { useAttachedModules, useAttachedPipettes } from '../hooks'
import { ChooseProtocolSlideout } from '../../ChooseProtocolSlideout'
import { UpdateRobotBanner } from '../../UpdateRobotBanner'
import { RobotStatusBanner } from '../RobotStatusBanner'
import { RobotCard } from '../RobotCard'

jest.mock('../../ProtocolUpload/hooks')
jest.mock('../hooks')
jest.mock('../RobotStatusBanner')
jest.mock('../../UpdateRobotBanner')
jest.mock('../../ChooseProtocolSlideout')

const OT2_PNG_FILE_NAME = 'OT2-R_HERO.png'

const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
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

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotCard robot={mockConnectableRobot} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotCard', () => {
  beforeEach(() => {
    mockUseAttachedModules.mockReturnValue(
      mockFetchModulesSuccessActionPayloadModules
    )
    mockUseAttachedPipettes.mockReturnValue({
      left: mockLeftProtoPipette,
      right: mockRightProtoPipette,
    })
    mockRobotStatusBanner.mockReturnValue(<div>Mock RobotStatusBanner</div>)
    mockChooseProtocolSlideout.mockImplementation(({ showSlideout }) => (
      <div>
        Mock Choose Protocol Slideout {showSlideout ? 'showing' : 'hidden'}
      </div>
    ))
    mockUpdateRobotBanner.mockReturnValue(<div>Mock UpdateRobotBanner</div>)
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

  it('renders the type of pipettes attached to left and right mounts', () => {
    const [{ getByText }] = render()

    getByText('Left Mount')
    getByText('Left Pipette')
    getByText('Right Mount')
    getByText('Right Pipette')
  })

  it('renders a modules section', () => {
    const [{ getByText }] = render()

    getByText('Modules')
  })
})
