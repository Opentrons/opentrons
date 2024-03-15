import * as React from 'react'
import { vi, it, describe, expect, beforeEach } from 'vitest'
import { StaticRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { getStoredProtocols } from '../../../redux/protocol-storage'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { useTrackCreateProtocolRunEvent } from '../../../organisms/Devices/hooks'
import { useCreateRunFromProtocol } from '../../ChooseRobotToRunProtocolSlideout/useCreateRunFromProtocol'
import { ChooseProtocolSlideout } from '../'
import { useNotifyService } from '../../../resources/useNotifyService'

vi.mock('../../ChooseRobotToRunProtocolSlideout/useCreateRunFromProtocol')
vi.mock('../../../redux/protocol-storage')
vi.mock('../../../organisms/Devices/hooks')
vi.mock('../../../redux/config')
vi.mock('../../../resources/useNotifyService')

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
  let mockCreateRunFromProtocol = vi.fn()
  let mockTrackCreateProtocolRunEvent = vi.fn()
  beforeEach(() => {
    mockCreateRunFromProtocol = vi.fn()
    mockTrackCreateProtocolRunEvent = vi.fn(
      () => new Promise(resolve => resolve({}))
    )
    vi.mocked(getStoredProtocols).mockReturnValue([storedProtocolDataFixture])
    vi.mocked(useCreateRunFromProtocol).mockReturnValue({
      createRunFromProtocolSource: mockCreateRunFromProtocol,
      reset: vi.fn(),
    } as any)
    vi.mocked(useTrackCreateProtocolRunEvent).mockReturnValue({
      trackCreateProtocolRunEvent: mockTrackCreateProtocolRunEvent,
    })
    vi.mocked(useNotifyService).mockReturnValue({} as any)
  })

  it('renders slideout if showSlideout true', () => {
    render({
      robot: mockConnectableRobot,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    screen.getByText(/choose protocol to run/i)
    screen.getByText(/opentrons-robot-name/i)
  })
  it('renders an available protocol option for every stored protocol if any', () => {
    render({
      robot: mockConnectableRobot,
      onCloseClick: vi.fn(),
      showSlideout: true,
    })
    screen.getByLabelText('protocol deck map')
    screen.getByText('fakeSrcFileName')
    expect(
      screen.queryByRole('heading', { name: 'No protocols found' })
    ).toBeNull()
  })
  it('renders an empty state if no protocol options', () => {
    vi.mocked(getStoredProtocols).mockReturnValue([])
    render({
      robot: mockConnectableRobot,
      onCloseClick: vi.fn(),
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
      onCloseClick: vi.fn(),
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
    vi.mocked(useCreateRunFromProtocol).mockReturnValue({
      runCreationError: 'run creation error',
      createRunFromProtocolSource: mockCreateRunFromProtocol,
      isCreatingRun: false,
      reset: vi.fn(),
      runCreationErrorCode: 500,
    })
    render({
      robot: mockConnectableRobot,
      onCloseClick: vi.fn(),
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
    vi.mocked(useCreateRunFromProtocol).mockReturnValue({
      runCreationError: 'Current run is not idle or stopped.',
      createRunFromProtocolSource: mockCreateRunFromProtocol,
      isCreatingRun: false,
      reset: vi.fn(),
      runCreationErrorCode: 409,
    })
    render({
      robot: mockConnectableRobot,
      onCloseClick: vi.fn(),
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
