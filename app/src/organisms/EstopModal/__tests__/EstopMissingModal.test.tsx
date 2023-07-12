import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { EstopMissingModal } from '../EstopMissingModal'

const render = (props: React.ComponentProps<typeof EstopMissingModal>) => {
  return renderWithProviders(<EstopMissingModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('EstopMissingModal', () => {
  let props: React.ComponentProps<typeof EstopMissingModal>

  beforeEach(() => {
    props = {
      isActiveRun: true,
      robotName: 'mockFlex',
    }
  })

  it('should render text - active run', () => {
    const [{ getByText }] = render(props)
    getByText('E-stop missing')
    getByText('Connect the E-stop to continue')
    getByText(
      'Your E-stop could be damaged or detached. mockFlex lost its connection to the E-stop, so it canceled the protocol. Connect a functioning E-stop to continue.'
    )
  })
  it('should render text - inactive run', () => {
    props.isActiveRun = false
    const [{ getByText }] = render(props)
    getByText('E-stop missing')
    getByText('Connect the E-stop to continue')
    getByText(
      'Your E-stop could be damaged or detached. mockFlex lost its connection to the E-stop, so it canceled the protocol. Connect a functioning E-stop to continue.'
    )
  })
})
