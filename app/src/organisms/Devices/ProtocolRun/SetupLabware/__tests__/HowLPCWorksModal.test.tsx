import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { HowLPCWorksModal } from '../HowLPCWorksModal'

const render = (props: React.ComponentProps<typeof HowLPCWorksModal>) => {
  return renderWithProviders(<HowLPCWorksModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HowLPCWorksModal', () => {
  let props: React.ComponentProps<typeof HowLPCWorksModal>
  beforeEach(() => {
    props = { onCloseClick: jest.fn() }
  })

  it('should render the correct header', () => {
    const { getByRole } = render(props)
    getByRole('heading', { name: 'How labware offsets work' })
  })
  it('should render the correct body', () => {
    const { getByText } = render(props)
    getByText(
      'A Labware Offset is a type of positional adjustment that accounts for small, real-world variances in the overall position of the labware on an OT-2’s deck. Labware Offset data is unique to a specific combination of labware definition, deck slot, and OT-2.'
    )
    getByText(
      'Labware Position Check is intended to correct for minor variances. Opentrons does not recommend using Labware Position Check to compensate for large positional adjustments. Needing to set large labware offsets could indicate a problem with robot calibration.'
    )
  })

  it('should render a link to robot cal', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('link', {
        name: 'Learn more about Robot Calibration',
      }).getAttribute('href')
    ).toBe(
      'https://support.opentrons.com/s/article/How-positional-calibration-works-on-the-OT-2'
    )
  })
  it('should render a link to the learn more page', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('link', {
        name: 'Learn more about Labware Offset Data',
      }).getAttribute('href')
    ).toBe(
      'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'
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
