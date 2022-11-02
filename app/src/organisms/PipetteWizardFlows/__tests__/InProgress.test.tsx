import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { InProgress } from '../InProgress'

const render = () => {
  return renderWithProviders(<InProgress />, { i18nInstance: i18n })[0]
}

describe('InProgress', () => {
  it('returns the correct information for calibration flow ', () => {
    const { getByText, getByLabelText } = render()
    getByText('Stand Back, Robot is in Motion')
    getByLabelText('spinner')
  })
})
