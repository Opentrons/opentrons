import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useHost } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { OPENTRONS_USB } from '/app/redux/discovery'

import { ProtocolRunCamera } from '..'
import { ImageGalleryContainer } from '../ImageGalleryContainer'
import { LaunchLivestreamBtn } from '../LaunchLivestreamBtn'

import type { RobotType } from '@opentrons/shared-data'

vi.mock('../LaunchLivestreamBtn')
vi.mock('../ImageGalleryContainer')
vi.mock('/app/redux/protocol-runs')
vi.mock('@opentrons/react-api-client', async () => {
  const actual = await vi.importActual('@opentrons/react-api-client')
  return {
    ...actual,
    useHost: vi.fn(),
  }
})

const render = (robotType: RobotType = 'OT-3 Standard') => {
  const RUN_ID = 'run123'
  return renderWithProviders(
    <ProtocolRunCamera
      runId={RUN_ID}
      robotType={robotType}
      runStatus={'MOCK-RUN-STATUS' as any}
      protocolName="MOCK-PROTOCOL"
      runTimestamp="MOCK-RUN-TIMESTAMP"
      robotName="MOCK-ROBOT-NAME"
      runRecordCameraSettings={null}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ProtocolRunCamera', () => {
  beforeEach(() => {
    vi.mocked(LaunchLivestreamBtn).mockReturnValue(
      <div>MOCK_LIVE_STREAM_BTN</div>
    )
    vi.mocked(ImageGalleryContainer).mockReturnValue(
      <div>MOCK_IMAGE_GALLERY_CONTAINER</div>
    )
  })

  it('renders camera text', () => {
    render()

    screen.getByText('Camera')
  })

  it('renders LaunchLivestreamBtn component', () => {
    render()

    screen.getByText('MOCK_LIVE_STREAM_BTN')
  })

  it('renders ImageGalleryContainer component', () => {
    render()

    screen.getByText('MOCK_IMAGE_GALLERY_CONTAINER')
  })

  it('renders chip with enabled status and text', () => {
    render()

    screen.getByTestId('Chip_success')
    screen.getByText('Enabled')
  })

  it('does not render the live stream button if the robot is an ot-2', () => {
    render('OT-2 Standard')

    expect(screen.queryByText('MOCK_LIVE_STREAM_BTN')).toBeFalsy()
  })

  it('does not render the live stream button if the connection is over usb', () => {
    vi.mocked(useHost).mockReturnValue({ hostname: OPENTRONS_USB })
    render()

    expect(screen.queryByText('MOCK_LIVE_STREAM_BTN')).toBeFalsy()
  })
})
