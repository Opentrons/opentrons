import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { DesktopEstopModal } from '../DesktopEstopModal'

const render = (props: React.ComponentProps<typeof DesktopEstopModal>) => {
  return renderWithProviders(<DesktopEstopModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DesktopEstopModal', () => {
  let props: React.ComponentProps<typeof DesktopEstopModal>

  beforeEach(() => {
    props = {
      isActiveRun: true,
      isEngaged: true,
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

  it.todo('should call a mock function when clicking resume robot operations')
})
