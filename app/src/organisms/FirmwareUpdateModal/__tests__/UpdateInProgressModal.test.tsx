import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { UpdateInProgressModal } from '../UpdateInProgressModal'

const render = (props: React.ComponentProps<typeof UpdateInProgressModal>) => {
  return renderWithProviders(<UpdateInProgressModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UpdateInProgressModal', () => {
  let props: React.ComponentProps<typeof UpdateInProgressModal>
  beforeEach(() => {
    props = {
      subsystem: 'pipette_right',
    }
  })
  it('renders text', () => {
    const { getByText } = render(props)
    getByText('Updating pipette firmware...')
  })
})
