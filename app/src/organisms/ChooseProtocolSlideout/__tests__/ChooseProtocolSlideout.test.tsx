import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { getStoredProtocols } from '../../../redux/protocol-storage'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { DeckThumbnail } from '../../../molecules/DeckThumbnail'
import { useTrackCreateProtocolRunEvent } from '../../../organisms/Devices/hooks'
import { useCreateRunFromProtocol } from '../../ChooseRobotToRunProtocolSlideout/useCreateRunFromProtocol'
import { ChooseProtocolSlideout } from '../'

jest.mock('../../ChooseRobotToRunProtocolSlideout/useCreateRunFromProtocol')
jest.mock('../../../redux/protocol-storage')
jest.mock('../../../molecules/DeckThumbnail')
jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../redux/config')

const mockGetStoredProtocols = getStoredProtocols as jest.MockedFunction<
  typeof getStoredProtocols
>
const mockUseCreateRunFromProtocol = useCreateRunFromProtocol as jest.MockedFunction<
  typeof useCreateRunFromProtocol
>
const mockDeckThumbnail = DeckThumbnail as jest.MockedFunction<
  typeof DeckThumbnail
>
const mockUseTrackCreateProtocolRunEvent = useTrackCreateProtocolRunEvent as jest.MockedFunction<
  typeof useTrackCreateProtocolRunEvent
>

const render = (props: React.ComponentProps<typeof ChooseProtocolSlideout>) => {
  return renderWithProviders(
    <StaticRouter>
      <ChooseProtocolSlideout {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ChooseProtocolSlideout', () => {
  let mockCreateRunFromProtocol: jest.Mock
  let mockTrackCreateProtocolRunEvent: jest.Mock
  beforeEach(() => {
    mockCreateRunFromProtocol = jest.fn()
    mockTrackCreateProtocolRunEvent = jest.fn(
      () => new Promise(resolve => resolve({}))
    )
    mockGetStoredProtocols.mockReturnValue([storedProtocolDataFixture])
    mockDeckThumbnail.mockReturnValue(<div>mock Deck Thumbnail</div>)
    mockUseCreateRunFromProtocol.mockReturnValue({
      createRunFromProtocolSource: mockCreateRunFromProtocol,
      reset: jest.fn(),
    } as any)
    mockUseTrackCreateProtocolRunEvent.mockReturnValue({
      trackCreateProtocolRunEvent: mockTrackCreateProtocolRunEvent,
    })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders slideout if showSlideout true', () => {
    const [{ queryAllByText }] = render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryAllByText('Choose Protocol to Run')).not.toBeFalsy()
    expect(queryAllByText(mockConnectableRobot.name)).not.toBeFalsy()
  })
  it('does not render slideout if showSlideout false', () => {
    const [{ queryAllByText }] = render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryAllByText('Choose Protocol to Run').length).toEqual(0)
    expect(queryAllByText(mockConnectableRobot.name).length).toEqual(0)
  })
  it('renders an available protocol option for every stored protocol if any', () => {
    const [{ getByText, queryByRole }] = render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    getByText('mock Deck Thumbnail')
    getByText('fakeSrcFileName')
    expect(queryByRole('heading', { name: 'No protocols found' })).toBeNull()
  })
  it('renders an empty state if no protocol options', () => {
    mockGetStoredProtocols.mockReturnValue([])
    const [{ getByRole, queryByText }] = render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryByText('mock Deck Thumbnail')).toBeNull()
    expect(queryByText('fakeSrcFileName')).toBeNull()
    expect(
      getByRole('heading', { name: 'No protocols found' })
    ).toBeInTheDocument()
  })
  it('calls createRunFromProtocolSource if CTA clicked', () => {
    const [{ getByRole }] = render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = getByRole('button', { name: 'Proceed to setup' })
    fireEvent.click(proceedButton)
    expect(mockCreateRunFromProtocol).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
  })
  it('renders error state when there is a run creation error', () => {
    mockUseCreateRunFromProtocol.mockReturnValue({
      runCreationError: 'run creation error',
      createRunFromProtocolSource: mockCreateRunFromProtocol,
      isCreatingRun: false,
      reset: jest.fn(),
      runCreationErrorCode: 500,
    })
    const [{ getByRole, getByText }] = render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = getByRole('button', { name: 'Proceed to setup' })
    proceedButton.click()
    expect(mockCreateRunFromProtocol).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
    expect(getByText('run creation error')).toBeInTheDocument()
  })

  it('renders error state when run creation error code is 409', () => {
    mockUseCreateRunFromProtocol.mockReturnValue({
      runCreationError: 'Current run is not idle or stopped.',
      createRunFromProtocolSource: mockCreateRunFromProtocol,
      isCreatingRun: false,
      reset: jest.fn(),
      runCreationErrorCode: 409,
    })
    const [{ getByRole, getByText }] = render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = getByRole('button', { name: 'Proceed to setup' })
    proceedButton.click()
    expect(mockCreateRunFromProtocol).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
    getByText('This robot is busy and can’t run this protocol right now.')
    const link = getByRole('link', { name: 'Go to Robot' })
    fireEvent.click(link)
    expect(link.getAttribute('href')).toEqual('/devices/opentrons-robot-name')
  })
})
