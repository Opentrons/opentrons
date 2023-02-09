import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
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
} from '../../../organisms/Devices/hooks'

import { RobotSettingsDeckCalibration } from '../RobotSettingsDeckCalibration'

import type { AttachedPipettesByMount } from '../../../redux/pipettes/types'

jest.mock('../../../organisms/CalibrationStatusCard')
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
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>

const render = (
  props?: Partial<React.ComponentProps<typeof RobotSettingsDeckCalibration>>
) => {
  return renderWithProviders(
    <RobotSettingsDeckCalibration robotName="otie" {...props} />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettingsDeckCalibration', () => {
  beforeEach(() => {
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: true,
    })
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockUseAttachedPipettes.mockReturnValue(mockAttachedPipettes)
    mockGetRequestById.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a title description and button', () => {
    const [{ getByText }] = render()
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

  it('renders the last calibrated when deck calibration is not good', () => {
    mockUseDeckCalibrationData.mockReturnValue({
      deckCalibrationData: mockWarningDeckCalData,
      isDeckCalibrated: true,
    })
    const [{ getByText }] = render()
    getByText('Last calibrated: September 22, 2222 00:00')
  })
})
