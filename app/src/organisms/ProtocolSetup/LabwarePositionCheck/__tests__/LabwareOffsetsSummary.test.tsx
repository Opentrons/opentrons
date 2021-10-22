import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { LabwareOffsetsSummary } from '../LabwareOffsetsSummary'

const render = () => {
  return renderWithProviders(<LabwareOffsetsSummary />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwareOffsetsSummary', () => {
  it('renders correct header and summary categories', () => {
    const { getByRole, getByText } = render()
    getByRole('heading', { name: 'Labware Offsets to be applied to this run' })
    getByText('Location')
    getByText('Labware')
    getByText('Labware Offset Data')
  })
})
