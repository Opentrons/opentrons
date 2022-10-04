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
      'Deck calibration measures the deck position relative to the gantry. This calibration is the foundation for tip length and pipette offset calibrations. Calibrate your deck during new robot setup. Redo deck calibration if you relocate your robot.'
    )
    getByRole('button', { name: 'Calibrate deck' })
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

  it('renders the error banner when deck is not calibrated', () => {
    mockUseDeckCalibrationStatus.mockReturnValue(
      Calibration.DECK_CAL_STATUS_IDENTITY
    )
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: null,
      isDeckCalibrated: false,
    })
    const [{ getByRole, getByText }] = render()
    getByText('Deck calibration missing')
    getByRole('button', { name: 'Calibrate now' })
  })

  it('deck cal button should be disabled if a button disabled reason is provided', () => {
    const [{ getByRole }] = render({
      buttonDisabledReason: 'otie is unreachable',
    })
    const button = getByRole('button', { name: 'Calibrate deck' })
    expect(button).toBeDisabled()
  })

  it('renders the warning banner when deck calibration is not good', () => {
    mockUseDeckCalibrationStatus.mockReturnValue(Calibration.DECK_CAL_STATUS_OK)
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: mockWarningDeckCalData,
      isDeckCalibrated: true,
    })
    const [{ getByRole, getByText }] = render()
    getByText('Deck calibration recommended')
    getByRole('button', { name: 'Recalibrate now' })
  })

  it('renders the error banner when a user has no pipette', () => {
    mockUseDeckCalibrationStatus.mockReturnValue(
      Calibration.DECK_CAL_STATUS_IDENTITY
    )
    const mockEmptyAttachedPipettes: AttachedPipettesByMount = {
      left: null,
      right: null,
    } as any
    mockUseAttachedPipettes.mockReturnValue(mockEmptyAttachedPipettes)
    const [{ getByText }] = render()
    getByText(
      'Deck calibration missing. Attach a pipette to perform deck calibration.'
    )
  })
})
