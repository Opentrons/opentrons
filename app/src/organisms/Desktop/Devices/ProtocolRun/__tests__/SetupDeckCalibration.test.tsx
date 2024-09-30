import { when } from 'vitest-when'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockDeckCalData } from '/app/redux/calibration/__fixtures__'
import { useDeckCalibrationData } from '../../hooks'
import { SetupDeckCalibration } from '../SetupDeckCalibration'

vi.mock('../../hooks')

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
    when(vi.mocked(useDeckCalibrationData)).calledWith(ROBOT_NAME).thenReturn({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: true,
    })
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders last calibrated content when deck is calibrated', () => {
    render()
    screen.getByText('Deck Calibration')
    screen.queryByText('Last calibrated:')
  })
  it('renders a link to the calibration dashboard if deck is not calibrated', () => {
    when(vi.mocked(useDeckCalibrationData)).calledWith(ROBOT_NAME).thenReturn({
      deckCalibrationData: null,
      isDeckCalibrated: false,
    })
    render()

    screen.getByText('Not calibrated yet')
    expect(
      screen
        .getByRole('link', {
          name: 'Calibrate now',
        })
        .getAttribute('href')
    ).toBe('/devices/otie/robot-settings/calibration/dashboard')
  })
})
