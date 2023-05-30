import * as React from 'react'
import { waitFor } from '@testing-library/dom'
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
  it('returns the correct information for cal modal error and pressing proceed calls props', async () => {
    props = {
      proceed: jest.fn(),
      errorMessage: 'error shmerror',
      isOnDevice: false,
      chainRunCommands: jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve()),
      mount: 'left',
      setShowErrorMessage: jest.fn(),
    }
    const { getByText, getByRole } = render(props)
    getByText('Pipette calibration failed')
    getByText('error shmerror')
    getByRole('button', { name: 'Next' }).click()
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'calibration/moveToMaintenancePosition' as const,
          params: {
            mount: 'left',
          },
        },
      ],
      false
    )
    await waitFor(() => {
      expect(props.proceed).toHaveBeenCalled()
    })
  })
  it('renders the on device button with correct text', async () => {
    props = {
      proceed: jest.fn(),
      errorMessage: 'error shmerror',
      isOnDevice: true,
      chainRunCommands: jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve()),
      mount: 'left',
      setShowErrorMessage: jest.fn(),
    }
    const { getByText, getByLabelText } = render(props)
    getByText('Pipette calibration failed')
    getByText('error shmerror')
    getByLabelText('SmallButton_primary').click()
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'calibration/moveToMaintenancePosition' as const,
          params: {
            mount: 'left',
          },
        },
      ],
      false
    )
    await waitFor(() => {
      expect(props.proceed).toHaveBeenCalled()
    })
  })
  it('calls setShowErrorMessage when a command fails', async () => {
    props = {
      proceed: jest.fn(),
      errorMessage: 'error shmerror',
      isOnDevice: true,
      chainRunCommands: jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.reject(new Error('failure test'))
        ),
      mount: 'left',
      setShowErrorMessage: jest.fn(),
    }
    const { getByLabelText } = render(props)
    getByLabelText('SmallButton_primary').click()
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'calibration/moveToMaintenancePosition' as const,
          params: {
            mount: 'left',
          },
        },
      ],
      false
    )
    await waitFor(() => {
      expect(props.setShowErrorMessage).toHaveBeenCalled()
    })
  })
})
