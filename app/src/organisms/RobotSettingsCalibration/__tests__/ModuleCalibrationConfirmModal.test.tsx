import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { ModuleCalibrationConfirmModal } from '../ModuleCalibrationConfirmModal'

const render = (
  props: React.ComponentProps<typeof ModuleCalibrationConfirmModal>
) => {
  return renderWithProviders(<ModuleCalibrationConfirmModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ModuleCalibrationConfirmModal', () => {
  let props: React.ComponentProps<typeof ModuleCalibrationConfirmModal>

  beforeEach(() => {
    props = {
      confirm: jest.fn(),
      cancel: jest.fn(),
    }
  })

  it('should render text and buttons', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Are you sure you want to clear module calibration data?')
    getByText(
      'This will immediately delete calibration data for this module on this robot.'
    )
    getByRole('button', { name: 'Cancel' })
    getByRole('button', { name: 'Clear data' })
  })

  it('should call a mock function when clicking cancel', () => {
    const [{ getByRole }] = render(props)
    getByRole('button', { name: 'Cancel' }).click()
    expect(props.cancel).toHaveBeenCalled()
  })

  it('should call a mock function when clicking confirm', () => {
    const [{ getByRole }] = render(props)
    getByRole('button', { name: 'Clear data' }).click()
    expect(props.confirm).toHaveBeenCalled()
  })
})
