import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CalibrationErrorModal } from '../CalibrationErrorModal'

const render = (props: React.ComponentProps<typeof CalibrationErrorModal>) => {
  return renderWithProviders(<CalibrationErrorModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('CalibrationErrorModal', () => {
  let props: React.ComponentProps<typeof CalibrationErrorModal>
  it('returns the correct information for cal modal error and pressing proceed calls props', () => {
    props = {
      proceed: jest.fn(),
      errorMessage: 'error shmerror',
      isOnDevice: false,
      chainRunCommands: jest.fn(() => Promise.resolve()),
      mount: 'left',
    }
    const { getByText, getByRole } = render(props)
    getByText('Pipette calibration failed')
    getByText('error shmerror')
    getByRole('button', { name: 'Next' }).click()
    expect(props.chainRunCommands).toHaveBeenCalled()
  })
  it('renders the on device button with correct text', () => {
    props = {
      proceed: jest.fn(),
      errorMessage: 'error shmerror',
      isOnDevice: true,
      chainRunCommands: jest.fn(() => Promise.resolve()),
      mount: 'left',
    }
    const { getByText, getByLabelText } = render(props)
    getByText('Pipette calibration failed')
    getByText('error shmerror')
    getByLabelText('SmallButton_primary').click()
    expect(props.chainRunCommands).toHaveBeenCalled()
  })
})
