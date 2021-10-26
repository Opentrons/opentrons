import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { DeckCalibrationModal } from '../DeckCalibrationModal'

const render = (props: React.ComponentProps<typeof DeckCalibrationModal>) => {
  return renderWithProviders(<DeckCalibrationModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DeckCalibrationModal', () => {
  let props: React.ComponentProps<typeof DeckCalibrationModal>
  beforeEach(() => {
    props = { onCloseClick: jest.fn() }
  })

  it('should render the correct header', () => {
    const { getByText } = render(props)
    getByText('See How Robot Calibration Works')
  })
  it('should render the correct body', () => {
    const { getByRole, getByText } = render(props)
    getByText(
      'Robot calibration establishes how the OT-2 knows where it is in relation to the deck. Accurate Robot calibration is essential to run protocols sucessfully. Robot calibration has 3 parts: Deck calibration, Tip Length calibration and Pipette Offset calibration.'
    )
    expect(getByRole('heading', { name: 'Deck Calibration' })).toBeTruthy()
    getByText(
      'This measures the deck X and Y values relative to the gantry. This calibration is the foundation for Tip Length and Pipette Offset calibrations. Calibrate your deck during new robot setup. Redo Deck calibration if you relocate your robot.'
    )
    expect(
      getByRole('heading', { name: 'Tip Length Calibration' })
    ).toBeTruthy()
    getByText(
      'This measures the Z distance between the bottom of the tip and the pipette’s nozzle. Calibrate tip length for each new tip type used on a pipette. If you redo the tip length calibration for the tip you used to calibrate a pipette, you will also have to redo that pipette offset calibration.'
    )
    expect(
      getByRole('heading', { name: 'Pipette Offset Calibration' })
    ).toBeTruthy()
    getByText(
      'This measures a pipette’s X, Y and Z values in relation to the pipette mount and the deck. Pipette offset calibration relies on Deck calibration and Tip Length calibration. Perform Pipette Offset calibration the first time you attach it to a new mount.'
    )
    getByText('Redo Pipette Offset calibration after:')
    getByText('Performing Deck calibration')
    getByText(
      'Redoing Tip Length calibration for the tip you used to calibration pipette'
    )
  })
  it('should render a link to the learn more page', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('link', {
        name: 'Learn more about robot calibration',
      }).getAttribute('href')
    ).toBe(
      'https://support.opentrons.com/en/articles/3499692-how-positional-calibration-works-on-the-ot-2'
    )
  })
  it('should call onCloseClick when the close button is pressed', () => {
    const { getByRole } = render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
