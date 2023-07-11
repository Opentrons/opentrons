import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { DesktopEstopPressedModal } from '../DesktopEstopPressedModal'

const render = (
  props: React.ComponentProps<typeof DesktopEstopPressedModal>
) => {
  return renderWithProviders(<DesktopEstopPressedModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DesktopEstopPressedModal', () => {
  let props: React.ComponentProps<typeof DesktopEstopPressedModal>

  beforeEach(() => {
    props = {
      isActiveRun: true,
      isEngaged: true,
      closeModal: jest.fn(),
    }
  })

  it('should render text and button - active run', () => {
    const [{ getByText, getByRole, getByTestId }] = render(props)
    getByText('E-stop pressed')
    getByText('E-stop Engaged')
    getByText(
      'First, safely clear the deck of any labware or spills. Then, twist the E-stop button counterclockwise. Finally, have Flex move the gantry to its home position.'
    )
    expect(
      getByRole('button', { name: 'Resume robot operations' })
    ).toBeDisabled()
    getByTestId('DesktopEstopModal_activeRun')
  })

  it('should render text and button - inactive run', () => {
    props.isActiveRun = false
    const [{ getByText, getByRole, getByTestId }] = render(props)
    getByText('E-stop pressed')
    getByText('E-stop Engaged')
    getByText(
      'First, safely clear the deck of any labware or spills. Then, twist the E-stop button counterclockwise. Finally, have Flex move the gantry to its home position.'
    )
    expect(
      getByRole('button', { name: 'Resume robot operations' })
    ).toBeDisabled()
    getByTestId('DesktopEstopModal_inactiveRun')
  })

  it('should resume robot operation button is not disabled', () => {
    props.isEngaged = false
    const [{ getByRole }] = render(props)
    expect(
      getByRole('button', { name: 'Resume robot operations' })
    ).not.toBeDisabled()
  })

  it('should call a mock function when clicking close icon', () => {
    const [{ getByTestId }] = render(props)
    getByTestId('ModalHeader_icon_close_E-stop pressed').click()
    expect(props.closeModal).toBeCalled()
  })

  it.todo('should call a mock function when clicking resume robot operations')
})
