import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components/__utils__'
import { mockDeckCalData } from '../../../../../redux/calibration/__fixtures__'
import * as calibrationSelectors from '../../../../../redux/calibration/selectors'

import { i18n } from '../../../../../i18n'
import { DeckCalibration } from '../DeckCalibration'

jest.mock('../../../../../redux/calibration/selectors')

const mockGetDeckCalData = calibrationSelectors.getDeckCalibrationData as jest.MockedFunction<
  typeof calibrationSelectors.getDeckCalibrationData
>

describe('DeckCalibration', () => {
  let render: () => ReturnType<typeof renderWithProviders>

  beforeEach(() => {
    mockGetDeckCalData.mockReturnValue(mockDeckCalData)
    render = () => {
      return renderWithProviders(<DeckCalibration robotName="robot name" />, {
        i18nInstance: i18n,
      })
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders all nodes with prop contents', () => {
    const { getByText } = render()
    expect(getByText('Deck Calibration')).toBeTruthy()
    expect(getByText('Robot Calibration Help')).toBeTruthy()
    expect(getByText('Last calibrated: September 15, 2021 00:00')).toBeTruthy()
  })
  it('opens robot cal help modal on click', () => {
    const { getByText } = render()
    fireEvent.click(getByText('Robot Calibration Help'))
    expect(
      getByText(
        `This measures the Z distance between the bottom of the tip and the pipette's nozzle. Calibrate tip length for each new tip type you use on a pipette. If you redo the tip length calibration for the tip you used to calibrate a pipette, you will also be prompted to recalibrate that pipette.`
      )
    ).toBeTruthy()
  })
  it('closes robot cal help modal on click', () => {
    const { getByText, getByRole } = render()
    fireEvent.click(getByText('Robot Calibration Help'))
    fireEvent.click(getByRole('button', { name: 'close' }))
    expect(getByText('Deck Calibration')).toBeTruthy()
  })
})
