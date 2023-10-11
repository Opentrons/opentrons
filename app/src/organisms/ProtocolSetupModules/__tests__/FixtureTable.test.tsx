import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { FixtureTable } from '../FixtureTable'

jest.mock('@opentrons/react-api-client')

const render = (props: React.ComponentProps<typeof FixtureTable>) => {
  return renderWithProviders(<FixtureTable {...props} />, {
    i18nInstance: i18n,
  })
}

describe('FixtureTable', () => {
  let props: React.ComponentProps<typeof FixtureTable>
  beforeEach(() => {
    props = {
      mostRecentAnalysis: [] as any,
    }
  })
  it('should render table header and contents', () => {
    const [{ getByText }] = render(props)
    getByText('Fixture')
    getByText('Location')
    getByText('Status')
  })
  it.todo('should render the current status - configured')
  it.todo('should render the current status - not configured')
  it.todo('should render the current status - location conflict')
})
