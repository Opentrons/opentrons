import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { Timer } from '../Timer'

const render = () => {
  return renderWithProviders(<Timer />, { i18nInstance: i18n })
}

describe('Timer', () => {
  it('renders a start time', () => {
    const [{ getByText }] = render()

    expect(getByText('Start Time: 4:25:23 PM GMT-04:00')).toBeTruthy()
  })

  it('renders a run time', () => {
    const [{ getByText }] = render()

    expect(getByText('Run Time:')).toBeTruthy()
    expect(getByText(/^(\d{2}):(\d{2}):(\d{2})$/)).toBeTruthy()
  })
})
