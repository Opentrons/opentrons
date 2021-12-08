import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { LabwareOffsetsSummary } from '../LabwareOffsetsSummary'

const render = (props: React.ComponentProps<typeof LabwareOffsetsSummary>) => {
  return renderWithProviders(<LabwareOffsetsSummary {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwareOffsetsSummary', () => {
  let props: React.ComponentProps<typeof LabwareOffsetsSummary>
  beforeEach(() => {
    props = { offsetData: [] }
  })
  it('renders a loading spinner while the offset diffs are being calculated', () => {
    const { container, getByRole } = render(props)
    getByRole('heading', { name: 'Labware Offsets to be applied to this run' })
    expect(
      container.querySelector('#LabwareOffsetsSummary_loadingSpinner')
    ).toBeInTheDocument()
  })
  it('renders correct header and summary categories', () => {
    props = {
      offsetData: [
        {
          labwareId: 'some_id',
          labwareOffsetLocation: { slotName: '1' },
          labwareDefinitionUri: 'some_def_uri',
          displayLocation: 'some_location',
          displayName: 'some_name',
          vector: { x: 1, y: 1, z: 1 },
        },
      ],
    }
    const { getByRole, getByText } = render(props)
    getByRole('heading', { name: 'Labware Offsets to be applied to this run' })
    getByText('Location')
    getByText('Labware')
    getByText('Labware Offset Data')
  })
})
