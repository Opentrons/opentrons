import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { RerunningProtocolModal } from '../../RerunningProtocolModal'
import { i18n } from '../../../../i18n'

const render = (props: React.ComponentProps<typeof RerunningProtocolModal>) => {
  return renderWithProviders(<RerunningProtocolModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RerunningProtocolModal', () => {
  let props: React.ComponentProps<typeof RerunningProtocolModal>
  beforeEach(() => {
    props = { onCloseClick: jest.fn() }
  })

  it('should render the correct header', () => {
    const { getByText } = render(props)
    getByText('How Rerunning A Protocol Works')
  })
  it('should render the correct body', () => {
    const { getByText } = render(props)

    getByText(
      'Opentrons displays the connected robot’s last protocol run on on the Protocol Upload page. If you run again, Opentrons loads this protocol and applies Labware Offset data if any exists.'
    )
    getByText(
      'Clicking “Run Again” will take you directly to the Run tab. If you’d like to review the deck setup or run Labware Position Check before running the protocol, navigate to the Protocol tab.'
    )
    getByText(
      'If you recalibrate your robot, it will clear the last run from the upload page.'
    )
  })

  it('should render a link to robot cal', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('link', {
        name: 'Learn more about Labware Offset Data',
      }).getAttribute('href')
    ).toBe('#') //   TODO IMMEDIATELY replace with actual link
  })
  it('should call onCloseClick when the close button is pressed', () => {
    const { getByRole } = render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
