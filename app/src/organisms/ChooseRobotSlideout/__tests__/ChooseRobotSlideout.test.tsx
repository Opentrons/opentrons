import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { simpleAnalysisFileFixture } from '@opentrons/api-client'
import {StaticRouter} from 'react-router-dom'
import { i18n } from '../../../i18n'
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
import { AvailableRobotOption } from '../AvailableRobotOption'
import { ChooseRobotSlideout } from '../'

import type { ProtocolAnalysisFile } from '@opentrons/shared-data'

jest.mock('../../../redux/discovery/selectors')
jest.mock('../AvailableRobotOption')

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
const mockAvailableRobotOption = AvailableRobotOption as jest.MockedFunction<typeof AvailableRobotOption>
const mockStartDiscovery = startDiscovery as jest.MockedFunction<
  typeof startDiscovery
>

const storedProtocolDataFixture = {
  protocolKey: 'protocolKeyStub',
  mostRecentAnalysis: (simpleAnalysisFileFixture as any) as ProtocolAnalysisFile<{}>,
  srcFileNames: ['fakeSrcFileName'],
  srcFiles: ['fakeSrcFile' as any],
  modified: 123456789,
}

const render = (props: React.ComponentProps<typeof ChooseRobotSlideout>) => {
  return renderWithProviders(
    <StaticRouter>
      <ChooseRobotSlideout {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('ChooseRobotSlideout', () => {
  beforeEach(() => {
    mockGetConnectableRobots.mockReturnValue([mockConnectableRobot])
    mockGetUnreachableRobots.mockReturnValue([mockUnreachableRobot])
    mockGetReachableRobots.mockReturnValue([mockReachableRobot])
    mockGetScanning.mockReturnValue(false)
    mockAvailableRobotOption.mockReturnValue(<div>mock Available Robot Option</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })


  it('renders slideout if showSlideout true', () => {
    const { queryAllByText } = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryAllByText('Choose Robot to Run')).not.toBeFalsy()
    expect(queryAllByText('fakeSrcFileName')).not.toBeFalsy()
  })
  it('does not render slideout if showSlideout false', () => {
    const { queryAllByText } = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryAllByText('Choose Robot to Run').length).toEqual(0)
    expect(queryAllByText('fakeSrcFileName').length).toEqual(0)
  })
  it('renders an available robot option for every connectable robot, and link for other robots', () => {
    const { queryByText } = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryByText('mock Available Robot Option')).toBeInTheDocument()
    expect(queryByText('2 unavailable or busy robots are not listed')).toBeInTheDocument()
  })
  it('if scanning, show robots, but do not show link to other devices', () => {
    mockGetScanning.mockReturnValue(true)
    const { queryByText } = render({
      storedProtocolData: storedProtocolDataFixture,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryByText('mock Available Robot Option')).toBeInTheDocument()
    expect(queryByText('2 unavailable or busy robots are not listed')).not.toBeInTheDocument()
  })
})
