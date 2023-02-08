import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Calibration from '../../../redux/calibration'
import { useFeatureFlag } from '../../../redux/config'
import * as RobotApi from '../../../redux/robot-api'
import {
  mockDeckCalData,
  mockWarningDeckCalData,
} from '../../../redux/calibration/__fixtures__'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { mockAttachedPipette } from '../../../redux/pipettes/__fixtures__'
import {
  useDeckCalibrationData,
  useRobot,
  useAttachedPipettes,
  useDeckCalibrationStatus,
  useRunStartedOrLegacySessionInProgress,
} from '../../../organisms/Devices/hooks'

import { RobotSettingsDeckCalibration } from '../RobotSettingsDeckCalibration'

import type { AttachedPipettesByMount } from '../../../redux/pipettes/types'

jest.mock('../../../organisms/CalibrationStatusCard')
jest.mock('../../../redux/config')
jest.mock('../../../redux/robot-api/selectors')
jest.mock('../../../organisms/Devices/hooks')

const mockAttachedPipettes: AttachedPipettesByMount = {
  left: mockAttachedPipette,
  right: mockAttachedPipette,
} as any
const mockUseDeckCalibrationData = useDeckCalibrationData as jest.MockedFunction<
  typeof useDeckCalibrationData
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockUseDeckCalibrationStatus = useDeckCalibrationStatus as jest.MockedFunction<
  typeof useDeckCalibrationStatus
>
const mockUseRunStartedOrLegacySessionInProgress = useRunStartedOrLegacySessionInProgress as jest.MockedFunction<
  typeof useRunStartedOrLegacySessionInProgress
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>

const mockUpdateRobotStatus = jest.fn()
const mockDispatchRequests = jest.fn()

const render = (
  props?: Partial<React.ComponentProps<typeof RobotSettingsDeckCalibration>>
) => {
  return renderWithProviders(
    <RobotSettingsDeckCalibration
      buttonDisabledReason={null}
      dispatchRequests={mockDispatchRequests}
      robotName="otie"
      updateRobotStatus={mockUpdateRobotStatus}
      {...props}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettingsDeckCalibration', () => {
  beforeEach(() => {
    mockUseRunStartedOrLegacySessionInProgress.mockReturnValue(false)
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: true,
    })
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockUseAttachedPipettes.mockReturnValue(mockAttachedPipettes)
    mockGetRequestById.mockReturnValue(null)
    mockUseFeatureFlag.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a title description and button', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Deck Calibration')
    getByText(
      'Calibrating the deck is required for new robots or after you relocate your robot. Recalibrating the deck will require you to also recalibrate pipette offsets.'
    )
    getByText('Last calibrated: September 15, 2021 00:00')
  })

  it('renders empty state if yet not calibrated', () => {
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: null,
      isDeckCalibrated: false,
    })
    const [{ getByText }] = render()
    getByText('Not calibrated yet')
  })

  it('does not render the error banner when deck is not calibrated', () => {
    mockUseDeckCalibrationStatus.mockReturnValue(
      Calibration.DECK_CAL_STATUS_IDENTITY
    )
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: null,
      isDeckCalibrated: false,
    })
    mockUseFeatureFlag.mockReturnValue(true)
    const [{ queryByText }] = render()
    expect(queryByText('Deck calibration missing')).not.toBeInTheDocument()
  })

  it('renders the last calibrated when deck calibration is not good', () => {
    mockUseDeckCalibrationStatus.mockReturnValue(Calibration.DECK_CAL_STATUS_OK)
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: mockWarningDeckCalData,
      isDeckCalibrated: true,
    })
    const [{ getByText }] = render()
    getByText('Last calibrated: September 15, 2021 00:00')
  })
})
