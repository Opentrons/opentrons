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
    const { getByRole } = render()
    expect(getByRole('heading', { name: 'Deck Calibration' })).toBeTruthy()
    expect(getByRole('link', { name: 'Robot Calibration Help' })).toBeTruthy()
  })
  it('opens robot cal help modal on click', () => {
    const { getByRole } = render()
    fireEvent.click(getByRole('link', { name: 'Robot Calibration Help' }))
    expect(
      getByRole('heading', { name: 'Tip Length Calibration' })
    ).toBeTruthy()
    expect(getByRole('button', { name: 'close' })).toBeTruthy()
  })
  it('closes robot cal help modal on click', () => {
    const { getByRole } = render()
    fireEvent.click(getByRole('link', { name: 'Robot Calibration Help' }))
    fireEvent.click(getByRole('button', { name: 'close' }))
    expect(getByRole('link', { name: 'Robot Calibration Help' })).toBeTruthy()
  })
})
