import { i18n } from '../../../i18n'
import { CheckUpdates } from '../CheckUpdates'
import { renderWithProviders } from '@opentrons/components'
import * as React from 'react'

const render = () =>
  renderWithProviders(<CheckUpdates />, {
    i18nInstance: i18n,
  })

describe('CheckUpdates', () => {
  it('should render text', () => {
    const [{ getByText }] = render()
    getByText('Checking for updates')
  })
})
