import * as React from 'react'
import { saveAs } from 'file-saver'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, waitFor } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { DeckCalibrationModal } from '../../../../organisms/ProtocolSetup/RunSetupCard/RobotCalibration/DeckCalibrationModal'
import { useTrackEvent } from '../../../../redux/analytics'
import * as RobotSelectors from '../../../../redux/robot/selectors'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
  mockPipetteOffsetCalibration3,
  mockPipetteOffsetCalibration4,
} from '../../../../redux/calibration/pipette-offset/__fixtures__'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
  mockTipLengthCalibration3,
} from '../../../../redux/calibration/tip-length/__fixtures__'
import {
  mockConnectableRobot,
  mockUnreachableRobot,
} from '../../../../redux/discovery/__fixtures__'
import { mockAttachedPipette } from '../../../../redux/pipettes/__fixtures__'
import {
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useRobot,
  useTipLengthCalibrations,
  useAttachedPipettes,
} from '../../hooks'

import { RobotSettingsCalibration } from '../RobotSettingsCalibration'
import { PipetteOffsetCalibrationItems } from '../CalibrationDetails/PipetteOffsetCalibrationItems'
import { TipLengthCalibrationItems } from '../CalibrationDetails/TipLengthCalibrationItems'

import type { AttachedPipettesByMount } from '../../../../redux/pipettes/types'

jest.mock('file-saver')
jest.mock(
  '../../../../organisms/ProtocolSetup/RunSetupCard/RobotCalibration/DeckCalibrationModal'
)
jest.mock('../../../../redux/analytics')
jest.mock('../../../../redux/config')
jest.mock('../../../../redux/calibration')
jest.mock('../../../../redux/robot/selectors')
jest.mock('../../../../redux/sessions/selectors')
jest.mock('../../../../redux/robot-api/selectors')
jest.mock('../../../../redux/custom-labware/selectors')
jest.mock('../../hooks')
jest.mock('../CalibrationDetails/PipetteOffsetCalibrationItems')
jest.mock('../CalibrationDetails/TipLengthCalibrationItems')

const mockAttachedPipettes: AttachedPipettesByMount = {
  left: mockAttachedPipette,
  right: mockAttachedPipette,
} as any
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
const mockGetIsRunning = RobotSelectors.getIsRunning as jest.MockedFunction<
  typeof RobotSelectors.getIsRunning
>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockPipetteOffsetCalibrationItems = PipetteOffsetCalibrationItems as jest.MockedFunction<
  typeof PipetteOffsetCalibrationItems
>
const mockTipLengthCalibrationItems = TipLengthCalibrationItems as jest.MockedFunction<
  typeof TipLengthCalibrationItems
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
    mockPipetteOffsetCalibrationItems.mockReturnValue(
      <div>PipetteOffsetCalibrationItems</div>
    )
    mockTipLengthCalibrationItems.mockReturnValue(
      <div>TipLengthCalibrationItems</div>
    )
    mockUseAttachedPipettes.mockReturnValue(mockAttachedPipettes)
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

  it('renders a title and description - Pipette Offset Calibrations', () => {
    const [{ getByText }] = render()
    getByText('Pipette Offset Calibrations')
    getByText(
      'Pipette offset calibration measures a pipette’s position relative to the pipette mount and the deck. You can recalibrate a pipette’s offset if its currently attached to this robot.'
    )
    getByText('PipetteOffsetCalibrationItems')
  })

  it('renders Not calibrated yet when no pipette offset calibrations data', () => {
    mockUsePipetteOffsetCalibrations.mockReturnValue(null)
    const [{ getByText }] = render()
    getByText('Not calibrated yet')
  })

  it('renders the error banner when calibration is missing', () => {
    mockUsePipetteOffsetCalibrations.mockReturnValue(null)
    const [{ getByText }] = render()
    getByText('Pipette Offset calibration missing')
  })

  it('renders the warning banner when calibration is marked bad', () => {
    mockUsePipetteOffsetCalibrations.mockReturnValue([
      mockPipetteOffsetCalibration1,
      mockPipetteOffsetCalibration2,
      mockPipetteOffsetCalibration3,
      mockPipetteOffsetCalibration4,
    ])
    const [{ getByText }] = render()
    getByText('Pipette Offset calibration recommended')
  })

  it('renders a title and description - Tip Length Calibrations', () => {
    const [{ getByText }] = render()
    getByText('Tip Length Calibrations')
    getByText(
      'Tip length calibration measures the distance between the bottom of the tip and the pipette’s nozzle. You can recalibrate a tip length if the pipette associated with it is currently attached to this robot. If you recalibrate a tip length, you will be prompted to recalibrate that pipette’s offset calibration.'
    )
    getByText('PipetteOffsetCalibrationItems')
  })

  it('renders Not calibrated yet when no tip length calibrations data', () => {
    mockUseTipLengthCalibrations.mockReturnValue(null)
    const [{ getByText }] = render()
    getByText('Not calibrated yet')
  })

  it('renders a title description and button - Deck Calibration', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Deck Calibration')
    getByText(
      'Deck calibration measures the deck position relative to the gantry. This calibration is the foundation for tip length and pipette offset calibrations. Calibrate your deck during new robot setup. Redo deck calibration if you relocate your robot.'
    )
    getByRole('button', { name: 'Recalibrate deck' })
    getByText('Last calibrated: September 15, 2021 00:00')
  })

  it('renders calibrate deck button when deck is not calibrated', () => {
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: null,
      isDeckCalibrated: false,
    })
    const [{ getByRole, getByText }] = render()
    getByRole('button', { name: 'Calibrate deck' })
    getByText('Not calibrated yet')
  })

  it('renders the banner when deck is not calibrated', () => {
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: null,
      isDeckCalibrated: false,
    })
    const [{ getByRole, getByText }] = render()
    getByText('Deck Calibration missing')
    getByRole('button', { name: 'Calibrate now' })
  })

  it('recalibration button is disabled when a robot is unreachable', () => {
    mockUseRobot.mockReturnValue(mockUnreachableRobot)
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Recalibrate deck' })
    expect(button).toBeDisabled()
  })

  it('recalibration button is disabled when a robot is running', () => {
    mockGetIsRunning.mockReturnValue(true)
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Recalibrate deck' })
    expect(button).toBeDisabled()
  })

  it('recalibration button is disabled when a robot pipettes are null', () => {
    mockUseAttachedPipettes.mockReturnValue({ left: null, right: null })
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Recalibrate deck' })
    expect(button).toBeDisabled()
  })

  it('calibration button is disabled when a robot is unreachable', () => {
    mockUseRobot.mockReturnValue(mockUnreachableRobot)
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: null,
      isDeckCalibrated: false,
    })
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Calibrate deck' })
    expect(button).toBeDisabled()
  })

  it('calibration button is disabled when a robot is running', () => {
    mockGetIsRunning.mockReturnValue(true)
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: null,
      isDeckCalibrated: false,
    })
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Calibrate deck' })
    expect(button).toBeDisabled()
  })

  it('calibration button is disabled when a robot pipettes are null', () => {
    mockUseAttachedPipettes.mockReturnValue({ left: null, right: null })
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: null,
      isDeckCalibrated: false,
    })
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Calibrate deck' })
    expect(button).toBeDisabled()
  })

  it('renders a title and description - Calibration Health Check section', () => {
    const [{ getByText }] = render()
    getByText('Calibration Health Check')
    getByText(
      'Check the accuracy of key calibration points without recalibrating the robot.'
    )
  })

  it('renders a Check health button', () => {
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Check health' })
    expect(button).not.toBeDisabled()
  })

  it('Health check button is disabled when a robot is unreachable', () => {
    mockUseRobot.mockReturnValue(mockUnreachableRobot)
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Check health' })
    expect(button).toBeDisabled()
  })

  it('Health check button is disabled when a robot is running', () => {
    mockGetIsRunning.mockReturnValue(true)
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Check health' })
    expect(button).toBeDisabled()
  })

  it('Health check button is disabled when pipette are not set', () => {
    mockUseAttachedPipettes.mockReturnValue({ left: null, right: null })
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Check health' })
    expect(button).toBeDisabled()
  })

  it('Health check button shows Tooltip when pipette are not set', async () => {
    mockUseAttachedPipettes.mockReturnValue({ left: null, right: null })
    const [{ getByRole, findByText }] = render()
    const button = getByRole('button', { name: 'Check health' })
    fireEvent.mouseMove(button)
    await waitFor(() => {
      findByText(
        'Fully calibrate your robot before checking calibration health'
      )
    })
  })
})
