import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CheckUpdates } from '../CheckUpdates'

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
