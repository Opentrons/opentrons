import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { getStoredProtocols } from '../../../redux/protocol-storage'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { useTrackCreateProtocolRunEvent } from '../../../organisms/Devices/hooks'
import { useCreateRunFromProtocol } from '../../ChooseRobotToRunProtocolSlideout/useCreateRunFromProtocol'
import { ChooseProtocolSlideout } from '../'

jest.mock('../../ChooseRobotToRunProtocolSlideout/useCreateRunFromProtocol')
jest.mock('../../../redux/protocol-storage')
jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../redux/config')

const mockGetStoredProtocols = getStoredProtocols as jest.MockedFunction<
  typeof getStoredProtocols
>
const mockUseCreateRunFromProtocol = useCreateRunFromProtocol as jest.MockedFunction<
  typeof useCreateRunFromProtocol
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
    render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    screen.getByText(/choose protocol to run/i)
    screen.getByText(/opentrons-robot-name/i)
  })
  it('renders an available protocol option for every stored protocol if any', () => {
    render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    screen.getByLabelText('protocol deck map')
    screen.getByText('fakeSrcFileName')
    expect(
      screen.queryByRole('heading', { name: 'No protocols found' })
    ).toBeNull()
  })
  it('renders an empty state if no protocol options', () => {
    mockGetStoredProtocols.mockReturnValue([])
    render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(screen.queryByLabelText('protocol deck map')).toBeNull()
    expect(screen.queryByText('fakeSrcFileName')).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'No protocols found' })
    ).toBeInTheDocument()
  })
  it('calls createRunFromProtocolSource if CTA clicked', () => {
    render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Proceed to setup',
    })
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
    render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Proceed to setup',
    })
    fireEvent.click(proceedButton)
    expect(mockCreateRunFromProtocol).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
    expect(screen.getByText('run creation error')).toBeInTheDocument()
  })

  it('renders error state when run creation error code is 409', () => {
    mockUseCreateRunFromProtocol.mockReturnValue({
      runCreationError: 'Current run is not idle or stopped.',
      createRunFromProtocolSource: mockCreateRunFromProtocol,
      isCreatingRun: false,
      reset: jest.fn(),
      runCreationErrorCode: 409,
    })
    render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    const proceedButton = screen.getByRole('button', {
      name: 'Proceed to setup',
    })
    fireEvent.click(proceedButton)
    expect(mockCreateRunFromProtocol).toHaveBeenCalledWith({
      files: [expect.any(File)],
      protocolKey: storedProtocolDataFixture.protocolKey,
    })
    expect(mockTrackCreateProtocolRunEvent).toHaveBeenCalled()
    screen.getByText(
      'This robot is busy and can’t run this protocol right now.'
    )
    const link = screen.getByRole('link', { name: 'Go to Robot' })
    fireEvent.click(link)
    expect(link.getAttribute('href')).toEqual('/devices/opentrons-robot-name')
  })
})
