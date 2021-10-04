import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { LabwareSetupModal } from '../LabwareSetupModal'

const render = (props: React.ComponentProps<typeof LabwareSetupModal>) => {
  return renderWithProviders(<LabwareSetupModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwareSetupModal', () => {
  let props: React.ComponentProps<typeof LabwareSetupModal>
  beforeEach(() => {
    props = { onCloseClick: jest.fn() }
  })

  it('should render the correct header', () => {
    const { getByRole } = render(props)
    expect(getByRole('heading', { name: 'Labware Help' })).toBeTruthy()
  })
  it('should render the correct body', () => {
    const { getByRole, getByText } = render(props)
    getByText(
      'You can make optional positioning adjustments before a protocol run using labware offsets. These adjustments are measured to the nearest 1/10th mm and can be made in X, Y and/or Z.'
    )
    getByText(
      'A labware offset is unique to a specific labware in a specific deck slot (and, if applicable, on a specific module) on an OT-2. Once you create an adjustment, it will be stored and can be used if you run the same protocol again.'
    )
    getByText(
      'Labware offsets apply to the overall labware, not individual features of it. If you need to make adjustments to individual features of the labware, edit your labware definition via'
    )
    expect(getByRole('heading', { name: 'Example' })).toBeTruthy()

    getByText(
      'Alice is using a labware in Slot 6. During labware position check, she adjust the pipette position while checking the A1 of the labware to 0.2mm in X, and 1.2mm in Z. Later, Bob is preparing to run the same protocol on that robot. The labware offset that Alice created in Slot 6 will be applied for Bob’s protocol unless he changes or clears it.'
    )
  })
  it('should render a link to labware creator', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('link', { name: 'Opentrons Labware Creator' }).getAttribute(
        'href'
      )
    ).toBe('https://labware.opentrons.com/create')
  })
  it('should render a link to the learn more page', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('link', {
        name: 'Learn More about labware and protocol best practices',
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
