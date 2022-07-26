import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { FirmwareUpdateFailedModal } from '../FirmwareUpdateFailedModal'
import { mockTemperatureModule } from '../../../redux/modules/__fixtures__'

const render = (
  props: React.ComponentProps<typeof FirmwareUpdateFailedModal>
) => {
  return renderWithProviders(<FirmwareUpdateFailedModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FirmwareUpdateFailedModal', () => {
  let props: React.ComponentProps<typeof FirmwareUpdateFailedModal>
  beforeEach(() => {
    props = {
      onCloseClick: jest.fn(),
      module: mockTemperatureModule,
      errorMessage: 'error message',
    }
  })

  it('should render the correct header and body', () => {
    const { getByText } = render(props)
    getByText('Failed to update module firmware')
    getByText(
      'An error occurred while updating your Temperature Module GEN1. Please try again.'
    )
    getByText('error message')
  })
  it('should call onCloseClick when the close button is pressed', () => {
    const { getByRole, getByLabelText } = render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(props.onCloseClick).toHaveBeenCalled()
    const closeIcon = getByLabelText('information')
    fireEvent.click(closeIcon)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
