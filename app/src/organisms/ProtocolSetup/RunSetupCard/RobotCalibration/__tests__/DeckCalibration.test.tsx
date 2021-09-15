import * as React from 'react'
import '@testing-library/jest-dom'
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
  })
})
