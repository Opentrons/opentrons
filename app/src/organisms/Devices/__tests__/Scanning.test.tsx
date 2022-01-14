import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { Scanning } from '../Scanning'

const render = () => {
  return renderWithProviders(<Scanning />, {
    i18nInstance: i18n,
  })
}

describe('Scanning', () => {
  it('renders a scanning message', () => {
    const [{ getByText }] = render()

    expect(getByText('Looking for robots...')).toBeTruthy()
  })
})
