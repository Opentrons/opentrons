import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { i18n } from '../../../i18n'
import { useProtocolDetailsForRun } from '../../../organisms/Devices/hooks'
import {
  useCloseCurrentRun,
  useCurrentRunId,
} from '../../../organisms/ProtocolUpload/hooks'
import { useCurrentRunStatus } from '../../../organisms/RunTimeControl/hooks'
import {
  getConnectableRobots,
  getReachableRobots,
  getScanning,
  getUnreachableRobots,
  startDiscovery,
} from '../../../redux/discovery'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { useCreateRunFromProtocol } from '../useCreateRunFromProtocol'
import { ChooseRobotSlideout } from '../'
import { fireEvent } from '@testing-library/react'

import type { ProtocolDetails } from '../../../organisms/Devices/hooks'

jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../organisms/ProtocolUpload/hooks')
jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock('../../../redux/discovery')
jest.mock('../useCreateRunFromProtocol')

const mockGetConnectableRobots = getConnectableRobots as jest.MockedFunction<
  typeof getConnectableRobots
>
const mockGetReachableRobots = getReachableRobots as jest.MockedFunction<
  typeof getReachableRobots
>
const mockGetUnreachableRobots = getUnreachableRobots as jest.MockedFunction<
  typeof getUnreachableRobots
>
const mockGetScanning = getScanning as jest.MockedFunction<typeof getScanning>
const mockStartDiscovery = startDiscovery as jest.MockedFunction<
  typeof startDiscovery
>
const mockUseCloseCurrentRun = useCloseCurrentRun as jest.MockedFunction<
  typeof useCloseCurrentRun
>

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>

const mockUseCurrentRunStatus = useCurrentRunStatus as jest.MockedFunction<
  typeof useCurrentRunStatus
>

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseCreateRunFromProtocol = useCreateRunFromProtocol as jest.MockedFunction<
  typeof useCreateRunFromProtocol
>

const render = (props: React.ComponentProps<typeof ChooseRobotSlideout>) => {
  return renderWithProviders(
    <StaticRouter>
      <ChooseRobotSlideout {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

let mockCloseCurrentRun: jest.Mock
let mockCreateRunFromProtocolSource: jest.Mock

describe('ChooseRobotSlideout', () => {
  beforeEach(() => {
    mockCloseCurrentRun = jest.fn()
    mockCreateRunFromProtocolSource = jest.fn()
    mockGetConnectableRobots.mockReturnValue([mockConnectableRobot])
    mockGetUnreachableRobots.mockReturnValue([mockUnreachableRobot])
    mockGetReachableRobots.mockReturnValue([mockReachableRobot])
    mockGetScanning.mockReturnValue(false)
    mockStartDiscovery.mockReturnValue({ type: 'mockStartDiscovery' } as any)
    mockUseCloseCurrentRun.mockReturnValue({
      isClosingCurrentRun: false,
      closeCurrentRun: mockCloseCurrentRun,
    })
    mockUseCurrentRunId.mockReturnValue(null)
    mockUseCurrentRunStatus.mockReturnValue(null)
    mockUseProtocolDetailsForRun.mockReturnValue({
      displayName: 'A Protocol for Otie',
    } as ProtocolDetails)
    mockUseCreateRunFromProtocol.mockReturnValue({
      createRunFromProtocolSource: mockCreateRunFromProtocolSource,
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders slideout if showSlideout true', () => {
    const [{ queryAllByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryAllByText('Choose Robot to Run')).not.toBeFalsy()
    expect(queryAllByText('fakeSrcFileName')).not.toBeFalsy()
  })
  it('does not render slideout if showSlideout false', () => {
    const [{ queryAllByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryAllByText('Choose Robot to Run').length).toEqual(0)
    expect(queryAllByText('fakeSrcFileName').length).toEqual(0)
  })
  it('renders an available robot option for every connectable robot, and link for other robots', () => {
    const [{ queryByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryByText('opentrons-robot-name')).toBeInTheDocument()
    expect(
      queryByText('2 unavailable or busy robots are not listed')
    ).toBeInTheDocument()
  })
  it('if scanning, show robots, but do not show link to other devices', () => {
    mockGetScanning.mockReturnValue(true)
    const [{ queryByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryByText('opentrons-robot-name')).toBeInTheDocument()
    expect(
      queryByText('2 unavailable or busy robots are not listed')
    ).not.toBeInTheDocument()
  })
  it('if not scanning, show refresh button, start discovery if clicked', () => {
    const [{ getByRole }, { dispatch }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const refreshButton = getByRole('button', { name: 'Refresh list' })
    fireEvent.click(refreshButton)
    expect(mockStartDiscovery).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: 'mockStartDiscovery' })
  })
  it('allows an available robot to be selected', () => {
    const [{ getByRole, getByText }] = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = getByRole('button', { name: 'Proceed to setup' })
    expect(proceedButton).toBeDisabled()
    const mockRobot = getByText('opentrons-robot-name')
    mockRobot.click()
    expect(proceedButton).not.toBeDisabled()
    proceedButton.click()
    expect(mockCreateRunFromProtocolSource).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
  })
})
