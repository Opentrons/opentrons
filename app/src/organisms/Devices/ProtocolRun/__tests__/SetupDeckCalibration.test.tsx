import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { useDeckCalibrationData } from '../../hooks'
import { SetupCalibrationItem } from '../SetupCalibrationItem'
import { SetupDeckCalibration } from '../SetupDeckCalibration'

jest.mock('../../hooks')
jest.mock('../SetupCalibrationItem')

const mockUseDeckCalibrationData = useDeckCalibrationData as jest.MockedFunction<
  typeof useDeckCalibrationData
>
const mockSetupCalibrationItem = SetupCalibrationItem as jest.MockedFunction<
  typeof SetupCalibrationItem
>

const ROBOT_NAME = 'otie'

const render = () => {
  return renderWithProviders(<SetupDeckCalibration robotName={ROBOT_NAME} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SetupDeckCalibration', () => {
  beforeEach(() => {
    when(mockUseDeckCalibrationData)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(mockDeckCalData)
    when(mockSetupCalibrationItem).mockReturnValue(
      <div>Mock SetupCalibrationItem</div>
    )
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders all nodes with prop contents', () => {
    const { getByText } = render()
    getByText('Deck Calibration')
    getByText('Mock SetupCalibrationItem')
  })
  it('renders null if deckCalData is null', () => {
    when(mockUseDeckCalibrationData)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(null)
    const { container } = render()
    expect(container.firstChild).toBeNull()
  })
})
