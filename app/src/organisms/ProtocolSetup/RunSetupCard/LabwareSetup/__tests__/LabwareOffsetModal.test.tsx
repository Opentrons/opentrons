import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { LabwareOffsetModal } from '../LabwareOffsetModal'

const render = (props: React.ComponentProps<typeof LabwareOffsetModal>) => {
  return renderWithProviders(<LabwareOffsetModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwareOffsetModal', () => {
  let props: React.ComponentProps<typeof LabwareOffsetModal>
  beforeEach(() => {
    props = { onCloseClick: jest.fn() }
  })

  it('should render the correct header', () => {
    const { getByRole } = render(props)
    expect(getByRole('heading', { name: 'How Offset Data Works' })).toBeTruthy()
  })
  it('should render the correct body', () => {
    const { getByRole, getByText } = render(props)

    getByRole('heading', { name: 'Positional Adjustments Overview' })

    getByText(
      'The OT-2 provides two types of positional adjustments. The first type is robot calibration: Deck calibration, Tip Length calibration and Pipette Offset calibration. These calibrations ensure the OT-2 moves to the expected positions on the deck. It is essential to have good robot calibration before creating any labware offsets and running protocols.'
    )
    getByText(
      'Opentrons offers a second type of positional adjustment, a Labware Offset. Labware Offsets are intended to account for small, real-world variances in the overall position of the labware on an OT-2’s deck. A Labware Offset is unique to a specific combination of the following: labware, module (if present), deck slot, protocol and OT-2.'
    )
    getByRole('heading', {
      name: 'Creating Labware Offset Data During Labware Position Check',
    })

    getByText(
      'Labware Position Check is a guided workflow that helps you verify the position of every labware on the deck for an added degree of precision in your protocol. When you check a labware, the OT-2’s pipette nozzle or attached tip will stop at the center of the A1 well. If the pipette nozzle or tip is not centered, you can reveal the OT-2’s jog controls to make an adjustment. This Labware Offset will be applied to the entire labware. Offset data is measured to the nearest 1/10th mm and can be made in the X, Y and/or Z directions.'
    )
    getByRole('heading', { name: 'Rerunning a Protocol' })

    getByText(
      'Opentrons displays the connected robot’s last protocol run on on the Protocol Upload page. If you run again, Opentrons loads this protocol and applies Labware Offset data if any exists.'
    )
    getByText(
      'Clicking “Run Again” will take you directly to the Run tab. If you’d like to review the deck setup or run Labware Position Check before running the protocol, navigate to the Protocol tab.'
    )
  })

  it('should render a link to robot cal', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('link', {
        name: 'Learn more about Robot Calibration',
      }).getAttribute('href')
    ).toBe(
      'https://support.opentrons.com/en/articles/3499692-how-positional-calibration-works-on-the-ot-2'
    )
  })
  it('should render a link to the learn more page', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('link', {
        name: 'Learn more about Labware Offset Data',
      }).getAttribute('href')
    ).toBe('#') // replace when we have an actual link
  })
  it('should call onCloseClick when the close button is pressed', () => {
    const { getByRole } = render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
