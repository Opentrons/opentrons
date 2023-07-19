import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { ConfirmAttachedModal } from '../ConfirmAttachedModal'

const mockOnCloseClick = jest.fn()
const mockOnConfirmClick = jest.fn()

const render = (props: React.ComponentProps<typeof ConfirmAttachedModal>) => {
  return renderWithProviders(<ConfirmAttachedModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ConfirmAttachedModal', () => {
  let props: React.ComponentProps<typeof ConfirmAttachedModal>

  beforeEach(() => {
    props = {
      onCloseClick: mockOnCloseClick,
      isProceedToRunModal: true,
      onConfirmClick: mockOnConfirmClick,
    }
  })

  it('should render text and buttons', () => {
    const [{ getByText }] = render(props)
    getByText('Confirm Heater-Shaker Module is attached')
    getByText(
      'Before the run begins, module should have both anchors fully extended for a firm attachment. The thermal adapter should be attached to the module.'
    )
    getByText('Cancel')
    getByText('Proceed to run')
  })

  it('should call a mock function when tapping cancel button', () => {
    const [{ getByText }] = render(props)
    getByText('Cancel').click()
    expect(mockOnCloseClick).toHaveBeenCalled()
  })

  it('should call a mock function when tapping proceed to run button', () => {
    const [{ getByText }] = render(props)
    getByText('Proceed to run').click()
    expect(mockOnConfirmClick).toHaveBeenCalled()
  })
})
