import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { SecureLabwareModal } from '../SecureLabwareModal'

const render = (props: React.ComponentProps<typeof SecureLabwareModal>) => {
  return renderWithProviders(<SecureLabwareModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockTypeMagDeck = 'magneticModuleType'
const mockTypeTC = 'thermocyclerModuleType'

describe('SecureLabwareModal', () => {
  let props: React.ComponentProps<typeof SecureLabwareModal>
  beforeEach(() => {
    props = { type: mockTypeMagDeck, onCloseClick: jest.fn() }
  })
  it('should render the correct modal for magnetic module type', () => {
    const { getByText, getByRole } = render(props)
    getByText('Securing Labware to the Magnetic Module')
    getByText(
      'Opentrons recommends ensuring your labware locks to the Magnetic Module by adjusting the black plate bracket on top of the module.'
    )
    getByText(
      'Please note there are two sizes of plate brackets supplied with your module: standard and deep well. These brackets can be removed and swapped by unscrewing the module’s thumb screw (the silver knob on the front).'
    )
    getByText('Magnetic Module with 0.2 mL 96 well PCR Plate')
    getByText('Magnetic Module with 2 mL Deep Well Plate')
    getByRole('button', { name: 'close' })
  })
  it('should render magnetic module type modal and call onCloseClick when button is pressed', () => {
    const { getByRole } = render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
  it('should render the correct modal for thermocycler module type', () => {
    props = { type: mockTypeTC, onCloseClick: jest.fn() }
    const { getByText, getByRole } = render(props)
    getByText('Securing Labware to the Thermocycler')
    getByText(
      'Opentrons recommends ensuring your labware locks to the Thermocycler module by securing the Thermocycler Latch Mechanism. This latch secures the plate on the module to ensure level and accurate plate placement for optimal results.'
    )
    getByRole('button', { name: 'close' })
  })
  it('should render tc module type modal and call onCloseClick when button is pressed', () => {
    props = { type: mockTypeTC, onCloseClick: jest.fn() }
    const { getByRole } = render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
