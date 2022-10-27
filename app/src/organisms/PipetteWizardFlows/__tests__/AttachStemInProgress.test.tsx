import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { AttachStemInProgress } from '../AttachStemInProgress'

const render = () => {
  return renderWithProviders(<AttachStemInProgress />)[0]
}

describe('AttachStemInProgress', () => {
  it('returns the correct information ', () => {
    const { getByText, getByAltText } = render()
    getByText('Stand Back, Pipette is Calibrating')
    getByAltText('Pipette is calibrating')
  })
})
