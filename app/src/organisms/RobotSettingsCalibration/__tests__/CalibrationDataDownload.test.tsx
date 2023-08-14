import * as React from 'react'
import { saveAs } from 'file-saver'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { instrumentsResponseFixture } from '@opentrons/api-client'

import { i18n } from '../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
} from '../../../redux/analytics'
import { mockDeckCalData } from '../../../redux/calibration/__fixtures__'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
  mockPipetteOffsetCalibration3,
} from '../../../redux/calibration/pipette-offset/__fixtures__'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
  mockTipLengthCalibration3,
} from '../../../redux/calibration/tip-length/__fixtures__'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import {
  useDeckCalibrationData,
  useIsOT3,
  usePipetteOffsetCalibrations,
  useRobot,
  useTipLengthCalibrations,
} from '../../../organisms/Devices/hooks'

import { CalibrationDataDownload } from '../CalibrationDataDownload'

jest.mock('file-saver')
jest.mock('@opentrons/react-api-client')
jest.mock('../../../redux/analytics')
jest.mock('../../../organisms/Devices/hooks')

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
const mockUseIsOT3 = useIsOT3 as jest.MockedFunction<typeof useIsOT3>
const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>

let mockTrackEvent: jest.Mock
const mockSetShowHowCalibrationWorksModal = jest.fn()

const render = () => {
  return renderWithProviders(
    <CalibrationDataDownload
      robotName="otie"
      setShowHowCalibrationWorksModal={mockSetShowHowCalibrationWorksModal}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CalibrationDataDownload', () => {
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
    when(mockUseTrackEvent).calledWith().mockReturnValue(mockTrackEvent)
    when(mockUseDeckCalibrationData)
      .calledWith(mockConnectableRobot.name)
      .mockReturnValue({
        deckCalibrationData: mockDeckCalData,
        isDeckCalibrated: true,
      })
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(false)
    when(mockUsePipetteOffsetCalibrations)
      .calledWith()
      .mockReturnValue([
        mockPipetteOffsetCalibration1,
        mockPipetteOffsetCalibration2,
        mockPipetteOffsetCalibration3,
      ])
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockConnectableRobot)
    when(mockUseTipLengthCalibrations)
      .calledWith()
      .mockReturnValue([
        mockTipLengthCalibration1,
        mockTipLengthCalibration2,
        mockTipLengthCalibration3,
      ])
    mockUseInstrumentsQuery.mockReturnValue({
      data: { data: [] },
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders a title and description for OT2', () => {
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(false)
    const [{ getByText }] = render()
    getByText('Download Calibration Data')
  })

  it('renders an OT-3 title and description - About Calibration', () => {
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    const [{ queryByText }] = render()
    queryByText(
      `For the robot to move accurately and precisely, you need to calibrate it. Pipette and gripper calibration is an automated process that uses a calibration probe or pin.`
    )
    queryByText(
      `After calibration is complete, you can save the calibration data to your computer as a JSON file.`
    )
  })

  it('renders a download calibration data button', () => {
    const [{ getByText }] = render()
    const downloadButton = getByText('Download calibration data')
    downloadButton.click()
    expect(saveAs).toHaveBeenCalled()
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
      properties: {},
    })
  })

  it('renders a download calibration button for Flex when cal data is present', () => {
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    mockUseInstrumentsQuery.mockReturnValue({
      data: { data: [instrumentsResponseFixture.data[0]] },
    } as any)
    const [{ getByText }] = render()
    const downloadButton = getByText('Download calibration data')
    downloadButton.click()
    expect(saveAs).toHaveBeenCalled()
  })

  it('renders a See how robot calibration works link', () => {
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    const [{ getByRole }] = render()
    const SUPPORT_LINK = 'https://support.opentrons.com'
    expect(
      getByRole('link', {
        name: 'See how robot calibration works',
      }).getAttribute('href')
    ).toBe(SUPPORT_LINK)
  })

  it('renders correct title and description', () => {
    const [{ getByText }] = render()
    getByText('Download Calibration Data')
    getByText('Save all three types of calibration data as a JSON file.')

    const downloadButton = getByText('Download calibration data')
    expect(downloadButton).toBeEnabled()
  })

  // TODO: RAUT-94 Verify the logic for these three test conditions holds for the new calibration flow

  it('renders disabled button when deck is not calibrated', () => {
    when(mockUseDeckCalibrationData)
      .calledWith(mockConnectableRobot.name)
      .mockReturnValue({
        deckCalibrationData: mockDeckCalData,
        isDeckCalibrated: false,
      })
    const [{ getByRole, getByText }] = render()
    getByText('No calibration data available.')

    const downloadButton = getByRole('button', {
      name: 'Download calibration data',
    })
    expect(downloadButton).toBeDisabled()
  })

  it('renders disabled button when pipettes are not calibrated', () => {
    when(mockUsePipetteOffsetCalibrations).calledWith().mockReturnValue([])
    const [{ getByRole, getByText }] = render()
    getByText('No calibration data available.')

    const downloadButton = getByRole('button', {
      name: 'Download calibration data',
    })
    expect(downloadButton).toBeDisabled()
  })

  it('renders disabled button for Flex when no instrument is calibrated', () => {
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    const [{ getByRole, queryByText }] = render()
    queryByText(
      `For the robot to move accurately and precisely, you need to calibrate it. Pipette and gripper calibration is an automated process that uses a calibration probe or pin.`
    )
    queryByText(
      `After calibration is complete, you can save the calibration data to your computer as a JSON file.`
    )

    const downloadButton = getByRole('button', {
      name: 'Download calibration data',
    })
    expect(downloadButton).toBeDisabled()
  })

  it('renders disabled button when tip lengths are not calibrated', () => {
    when(mockUseTipLengthCalibrations).calledWith().mockReturnValue([])
    const [{ getByRole, getByText }] = render()
    getByText('No calibration data available.')

    const downloadButton = getByRole('button', {
      name: 'Download calibration data',
    })
    expect(downloadButton).toBeDisabled()
  })
})
