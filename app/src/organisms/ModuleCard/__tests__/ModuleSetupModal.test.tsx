import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ModuleSetupModal } from '../ModuleSetupModal'

const render = (props: React.ComponentProps<typeof ModuleSetupModal>) => {
  return renderWithProviders(<ModuleSetupModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ModuleSetupModal', () => {
  let props: React.ComponentProps<typeof ModuleSetupModal>
  beforeEach(() => {
    props = { close: jest.fn(), moduleDisplayName: 'mockModuleDisplayName' }
  })

  it('should render the correct header', () => {
    const { getByRole } = render(props)
    getByRole('heading', { name: 'mockModuleDisplayName Setup Instructions' })
  })
  it('should render the correct body', () => {
    const { getByText } = render(props)
    getByText(
      'To attach the module to your robot, you need to install your module into a caddy, before lowering the caddy into the deck and connecting your module to the robot. Please reference the following support article for in depth instructions.'
    )
  })
  it('should render a link to the learn more page', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('link', {
        name: 'mockModuleDisplayName setup instructions',
      }).getAttribute('href')
    ).toBe('https://support.opentrons.com/s/modules')
  })
  it('should call close when the close button is pressed', () => {
    const { getByRole } = render(props)
    expect(props.close).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)
    expect(props.close).toHaveBeenCalled()
  })
})
