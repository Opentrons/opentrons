import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { AttachStemInProgress } from '../AttachStemInProgress'

const render = () => {
  return renderWithProviders(<AttachStemInProgress />, {
    i18nInstance: i18n,
  })[0]
}

describe('AttachStemInProgress', () => {
  it('returns the correct information ', () => {
    const { getByText, getByAltText } = render()
    getByText('Stand Back, Pipette is Calibrating')
    getByAltText('Pipette is calibrating')
  })
})
