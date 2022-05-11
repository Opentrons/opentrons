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
  useAttachedPipetteCalibrations,
} from '../../hooks'
import { RobotSettingsCalibration } from '../RobotSettingsCalibration'

jest.mock('file-saver')

jest.mock(
  '../../../../organisms/ProtocolSetup/RunSetupCard/RobotCalibration/DeckCalibrationModal'
)
jest.mock('../../../../redux/analytics')
jest.mock('../../../../redux/config')
jest.mock('../../../../redux/sessions/selectors')
jest.mock('../../../../redux/custom-labware/selectors')
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
const mockUseAttachedPipetteCalibrations = useAttachedPipetteCalibrations as jest.MockedFunction<
  typeof useAttachedPipetteCalibrations
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
    mockUseAttachedPipetteCalibrations.mockReturnValue([])
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a title and description - About Calibration', () => {
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

  // Pipette Offset Calibrations this comment will be removed when finish all sections
  it('renders a title and description - Pipette Offset Calibrations', () => {
    const [{ getByText }] = render()
    getByText('Pipette Offset Calibrations')
    getByText(
      'Pipette offset calibration measures a pipette’s position relative to the pipette mount and the deck. You can recalibrate a pipette’s offset if its currently attached to this robot.'
    )
  })

  // Tip Length Calibrations this comment will be removed when finish all sections
  it('renders a title and description - Tip Length Calibrations', () => {
    const [{ getByText }] = render()
    getByText('Tip Length Calibrations')
    getByText(
      'Tip length calibration measures the distance between the bottom of the tip and the pipette’s nozzle. You can recalibrate a tip length if the pipette associated with it is currently attached to this robot. If you recalibrate a tip length, you will be prompted to recalibrate that pipette’s offset calibration.'
    )
  })
})
