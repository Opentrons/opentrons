import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent, screen } from '@testing-library/react'
import {
  componentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import { mockDeckCalData } from '../../../../../redux/calibration/__fixtures__'
import * as calibrationSelectors from '../../../../../redux/calibration/selectors'
import { DeckCalibrationModal } from '../DeckCalibrationModal'
import { i18n } from '../../../../../i18n'
import { DeckCalibration } from '../DeckCalibration'
import { when } from 'jest-when'

jest.mock('../../../../../redux/calibration/selectors')
jest.mock('../DeckCalibrationModal')

const mockGetDeckCalData = calibrationSelectors.getDeckCalibrationData as jest.MockedFunction<
  typeof calibrationSelectors.getDeckCalibrationData
>
const mockDeckCalibrationModal = DeckCalibrationModal as jest.MockedFunction<
  typeof DeckCalibrationModal
>
const render = () => {
  return renderWithProviders(<DeckCalibration robotName="robot name" />, {
    i18nInstance: i18n,
  })[0]
}

describe('DeckCalibration', () => {
  beforeEach(() => {
    mockGetDeckCalData.mockReturnValue(mockDeckCalData)

    when(mockDeckCalibrationModal)
      .calledWith(
        componentPropsMatcher({
          onCloseClick: expect.anything(),
        })
      )
      .mockImplementation(({ onCloseClick }) => (
        <div onClick={onCloseClick}>mock deckCalibration modal</div>
      ))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders all nodes with prop contents', () => {
    const { getByRole } = render()
    expect(getByRole('heading', { name: 'Deck Calibration' })).toBeTruthy()
    expect(
      getByRole('link', { name: 'See How Robot Calibration Works' })
    ).toBeTruthy()
  })
  it('opens robot cal help modal on click', () => {
    const { getByText, getByRole } = render()
    expect(screen.queryByText('mock deckCalibration modal')).toBeNull()
    fireEvent.click(
      getByRole('link', { name: 'See How Robot Calibration Works' })
    )
    getByText('mock deckCalibration modal')
  })
  it('closes robot cal help modal on click', () => {
    const { getByText, getByRole } = render()
    fireEvent.click(
      getByRole('link', { name: 'See How Robot Calibration Works' })
    )
    const mockModal = getByText('mock deckCalibration modal')
    fireEvent.click(mockModal)
    expect(screen.queryByText('mock deckCalibration modal')).toBeNull()
  })
  it('renders null if deckCalData is null', () => {
    mockGetDeckCalData.mockReturnValue(null)
    const { container } = render()
    expect(container.firstChild).toBeNull()
  })
})
