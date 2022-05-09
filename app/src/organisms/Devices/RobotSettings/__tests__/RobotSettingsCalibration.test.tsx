import * as React from 'react'
import { saveAs } from 'file-saver'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { DeckCalibrationModal } from '../../../../organisms/ProtocolSetup/RunSetupCard/RobotCalibration/DeckCalibrationModal'
import { useTrackEvent } from '../../../../redux/analytics'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
  mockPipetteOffsetCalibration3,
} from '../../../../redux/calibration/pipette-offset/__fixtures__'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
  mockTipLengthCalibration3,
} from '../../../../redux/calibration/tip-length/__fixtures__'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'
import {
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useRobot,
  useTipLengthCalibrations,
} from '../../hooks'
import { RobotSettingsCalibration } from '../RobotSettingsCalibration'

jest.mock('file-saver')

jest.mock(
  '../../../../organisms/ProtocolSetup/RunSetupCard/RobotCalibration/DeckCalibrationModal'
)
jest.mock('../../../../redux/analytics')
jest.mock('../../../../redux/sessions/selectors')
jest.mock('../../../../redux/config')
jest.mock('../../../../redux/robot')
jest.mock('../../../../redux/robot-api/selectors')
jest.mock('../../../../redux/calibration')
jest.mock('../../hooks')

const mockDeckCalibrationModal = DeckCalibrationModal as jest.MockedFunction<
  typeof DeckCalibrationModal
>
const mockUseDeckCalibrationData = useDeckCalibrationData as jest.MockedFunction<
  typeof useDeckCalibrationData
>
const mockUsePipetteOffsetCalibrations = usePipetteOffsetCalibrations as jest.MockedFunction<
  typeof usePipetteOffsetCalibrations
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockUseTipLengthCalibrations = useTipLengthCalibrations as jest.MockedFunction<
  typeof useTipLengthCalibrations
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

let mockTrackEvent: jest.Mock

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotSettingsCalibration robotName="otie" />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettingsCalibration', () => {
  const realBlob = global.Blob
  beforeAll(() => {
    // @ts-expect-error(sa, 2021-6-28): not a valid blob interface
    global.Blob = function (content: any, options: any) {
      return { content, options }
    }
  })

  afterAll(() => {
    global.Blob = realBlob
  })

  beforeEach(() => {
    mockTrackEvent = jest.fn()
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    mockDeckCalibrationModal.mockReturnValue(
      <div>Mock DeckCalibrationModal</div>
    )
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: true,
    })
    mockUsePipetteOffsetCalibrations.mockReturnValue([
      mockPipetteOffsetCalibration1,
      mockPipetteOffsetCalibration2,
      mockPipetteOffsetCalibration3,
    ])
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockUseTipLengthCalibrations.mockReturnValue([
      mockTipLengthCalibration1,
      mockTipLengthCalibration2,
      mockTipLengthCalibration3,
    ])
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a title and description', () => {
    const [{ getByText }] = render()
    getByText('About Calibration')
    getByText(
      'For the robot to move accurately and precisely, you need to calibrate it. Positional calibration happens in three parts: deck calibration, pipette offset calibration and tip length calibration.'
    )
  })

  it('renders a clickable link to the deck calibration modal', () => {
    const [{ getByText, queryByText }] = render()
    expect(queryByText('Mock DeckCalibrationModal')).toBeFalsy()
    const modalLink = getByText('See how robot calibration works')
    modalLink.click()
    getByText('Mock DeckCalibrationModal')
  })

  it('renders a download calibration data button', () => {
    const [{ getByText }] = render()

    const downloadButton = getByText('Download calibration data')
    downloadButton.click()
    expect(saveAs).toHaveBeenCalled()
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: 'calibrationDataDownloaded',
      properties: {},
    })
  })

  // deck calibration this comment will be removed when finish all sections
  it('renders a title description and button - Deck Calibration', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Deck Calibration')
    getByText(
      'Deck calibration measures the deck position relative to the gantry. This calibration is the foundation for tip length and pipette offset calibrations. Calibrate your deck during new robot setup. Redo deck calibration if you relocate your robot.'
    )
    getByRole('button', { name: 'Recalibrate deck' })
  })

  it('renders calibrate deck button when deck is not calibrated', () => {
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: false,
    })
    const [{ getByRole }] = render()
    getByRole('button', { name: 'Calibrate deck' })
  })
})
