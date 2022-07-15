import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { RUN_STATUS_RUNNING } from '@opentrons/api-client'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'

import { i18n } from '../../../i18n'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../redux/modules/__fixtures__'
import {
  mockLeftProtoPipette,
  mockRightProtoPipette,
} from '../../../redux/pipettes/__fixtures__'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { getBuildrootUpdateDisplayInfo } from '../../../redux/buildroot'
import {
  useAttachedModules,
  useAttachedPipettes,
  useProtocolDetailsForRun,
} from '../hooks'
import { useCurrentRunId } from '../../../organisms/ProtocolUpload/hooks'
import { useCurrentRunStatus } from '../../../organisms/RunTimeControl/hooks'
import { ChooseProtocolSlideout } from '../../ChooseProtocolSlideout'
import { UpdateRobotBanner } from '../../UpdateRobotBanner'
import { RobotCard } from '../RobotCard'

import type { ProtocolAnalysisFile } from '@opentrons/shared-data'

jest.mock('../../../redux/buildroot/selectors')
jest.mock('../../../organisms/ProtocolUpload/hooks')
jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../hooks')
jest.mock('../../UpdateRobotBanner')
jest.mock('../../ChooseProtocolSlideout')

const OT2_PNG_FILE_NAME = 'OT2-R_HERO.png'

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

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolAnalysisFile<{}>
const PROTOCOL_DETAILS = {
  displayName: 'Testosaur',
  protocolData: simpleV6Protocol,
  protocolKey: 'fakeProtocolKey',
}

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
      })
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders an OT image', () => {
    const [{ getByRole }] = render()
    const image = getByRole('img')

    expect(image.getAttribute('src')).toEqual(OT2_PNG_FILE_NAME)
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

  it('renders the type of robot and robot name', () => {
    const [{ getByText }] = render()
    getByText('OT-2')
    getByText(mockConnectableRobot.name)
  })

  it('does not render a running protocol banner when a protocol is not running', () => {
    const [{ queryByText }] = render()

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

    const [{ getByRole, getByText }] = render()

    getByText('Testosaur; Running')

    const runLink = getByRole('link', { name: 'Go to Run' })
    expect(runLink.getAttribute('href')).toEqual(
      '/devices/opentrons-robot-name/protocol-runs/1/run-log'
    )
  })
})
