import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { EmptyRecentRun } from '../EmptyRecentRun'

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <EmptyRecentRun />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('EmptyRecentRun', () => {
  it('should render image and text', () => {
    const [{ getByText, getByAltText }] = render()
    getByAltText('RobotDashboard no recent run protocols')
    getByText('No recent runs')
    getByText('After you run some protocols, they will appear here.')
  })
})
