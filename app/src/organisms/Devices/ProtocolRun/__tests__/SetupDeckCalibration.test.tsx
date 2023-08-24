import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { useDeckCalibrationData } from '../../hooks'
import { SetupDeckCalibration } from '../SetupDeckCalibration'

jest.mock('../../hooks')

const mockUseDeckCalibrationData = useDeckCalibrationData as jest.MockedFunction<
  typeof useDeckCalibrationData
>

const ROBOT_NAME = 'otie'
const RUN_ID = '1'

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <SetupDeckCalibration robotName={ROBOT_NAME} runId={RUN_ID} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('SetupDeckCalibration', () => {
  beforeEach(() => {
    when(mockUseDeckCalibrationData).calledWith(ROBOT_NAME).mockReturnValue({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: true,
    })
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders last calibrated content when deck is calibrated', () => {
    const { getByText, queryByText } = render()
    getByText('Deck Calibration')
    queryByText('Last calibrated:')
  })
  it('renders a link to the calibration dashboard if deck is not calibrated', () => {
    when(mockUseDeckCalibrationData).calledWith(ROBOT_NAME).mockReturnValue({
      deckCalibrationData: null,
      isDeckCalibrated: false,
    })
    const { getByRole, getByText } = render()

    getByText('Not calibrated yet')
    expect(
      getByRole('link', {
        name: 'Calibrate now',
      }).getAttribute('href')
    ).toBe('/devices/otie/robot-settings/calibration/dashboard')
  })
})
