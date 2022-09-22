import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { HowCalibrationWorksModal } from '..'

const render = (
  props: React.ComponentProps<typeof HowCalibrationWorksModal>
) => {
  return renderWithProviders(<HowCalibrationWorksModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HowCalibrationWorksModal', () => {
  let props: React.ComponentProps<typeof HowCalibrationWorksModal>
  beforeEach(() => {
    props = { onCloseClick: jest.fn() }
  })

  it('should render the correct header', () => {
    const { getByText } = render(props)
    getByText('How Robot Calibration Works')
  })

  it('should render the correct body', () => {
    const { getByRole, getByText } = render(props)
    getByText(
      'Robot calibration establishes how the OT-2 knows where it is in relation to the deck. Accurate Robot calibration is essential to run protocols successfully. Robot calibration has 3 parts: Deck calibration, Tip Length calibration and Pipette Offset calibration.'
    )
    expect(getByRole('heading', { name: 'Deck Calibration' })).toBeTruthy()
    getByText(
      'This measures the deck X and Y values relative to the gantry. Deck Calibration is the foundation for Tip Length Calibration and Pipette Offset Calibration.'
    )
    getByText('Perform Deck Calibration during new robot setup.')
    getByText('Redo Deck Calibration if you relocate your robot.')
    expect(
      getByRole('heading', { name: 'Tip Length Calibration' })
    ).toBeTruthy()
    getByText(
      'This measures the Z distance between the bottom of the tip and the pipette’s nozzle. If you redo the tip length calibration for the tip you used to calibrate a pipette, you will also have to redo that Pipette Offset Calibration.'
    )
    getByText(
      'Perform Tip Length Calibration for each new tip type used on a pipette.'
    )
    expect(
      getByRole('heading', { name: 'Pipette Offset Calibration' })
    ).toBeTruthy()
    getByText(
      'This measures a pipette’s X, Y and Z values in relation to the pipette mount and the deck. Pipette Offset Calibration relies on Deck Calibration and Tip Length Calibration.'
    )
    getByText(
      'Perform Pipette Offset calibration the first time you attach a pipette to a new mount.'
    )
    getByText(
      'Redo Pipette Offset Calibration after performing Deck Calibration.'
    )
    getByText(
      'Redo Pipette Offset Calibration after performing Tip Length Calibration for the tip you used to calibrate the pipette.'
    )
  })

  it('should render a link to the learn more page', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('link', {
        name: 'Learn more about robot calibration',
      }).getAttribute('href')
    ).toBe(
      'https://support.opentrons.com/s/article/How-positional-calibration-works-on-the-OT-2'
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
