import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'
import { i18n } from '../../../../../i18n'
import { SetupFixtureList } from '../SetupFixtureList'
import { NotConfiguredModal } from '../NotConfiguredModal'
import { LocationConflictModal } from '../LocationConflictModal'

import type { CutoutConfigAndCompatibility } from '../../../../../resources/deck_configuration/hooks'

jest.mock('../../../../../resources/deck_configuration/hooks')
jest.mock('../LocationConflictModal')
jest.mock('../NotConfiguredModal')

const mockLocationConflictModal = LocationConflictModal as jest.MockedFunction<
  typeof LocationConflictModal
>
const mockNotConfiguredModal = NotConfiguredModal as jest.MockedFunction<
  typeof NotConfiguredModal
>

const mockDeckConfigCompatibility: CutoutConfigAndCompatibility[] = [
  // TODO(bh, 2023-11-13): mock out compatibility
]

const render = (props: React.ComponentProps<typeof SetupFixtureList>) => {
  return renderWithProviders(<SetupFixtureList {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupFixtureList', () => {
  let props: React.ComponentProps<typeof SetupFixtureList>
  beforeEach(() => {
    props = {
      deckConfigCompatibility: mockDeckConfigCompatibility,
    }
    mockLocationConflictModal.mockReturnValue(
      <div>mock location conflict modal</div>
    )
    mockNotConfiguredModal.mockReturnValue(<div>mock not configured modal</div>)
  })

  it('should render the headers and a fixture with configured status', () => {
    const { getByText, getByRole } = render(props)[0]
    getByText('Fixture')
    getByText('Location')
    getByText('Status')
    getByText('Waste Chute')
    getByRole('button', { name: 'View setup instructions' })
    getByText(WASTE_CHUTE_CUTOUT)
    getByText('Configured')
  })
  it('should render the headers and a fixture with conflicted status', () => {
    const { getByText, getByRole } = render(props)[0]
    getByText('Location conflict')
    getByRole('button', { name: 'Update deck' }).click()
    getByText('mock location conflict modal')
  })
  it('should render the headers and a fixture with not configured status and button', () => {
    const { getByText, getByRole } = render(props)[0]
    getByText('Not configured')
    getByRole('button', { name: 'Update deck' }).click()
    getByText('mock not configured modal')
  })
})
