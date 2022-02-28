import * as React from 'react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { Breadcrumbs } from '..'

const render = (path = '/') => {
  const pathCrumbs = [
    { pathSegment: 'devices', crumbName: 'Devices' },
    { pathSegment: 'otie', crumbName: 'otie' },
    { pathSegment: 'protocol-runs', crumbName: 'Protocol Runs' },
    { pathSegment: '10/21/2021 08:00:09', crumbName: '10/21/2021 08:00:09' },
  ]
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Breadcrumbs pathCrumbs={pathCrumbs} />
      <Switch>
        <Route exact path="/devices/otie/protocol-runs">
          <div>path matched</div>
        </Route>
      </Switch>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Breadcrumbs', () => {
  it('renders an array of breadcrumbs', () => {
    const [{ getByText }] = render()

    getByText('Devices')
    getByText('otie')
    getByText('Protocol Runs')
  })

  it('does nothing when the active breadcrumb is clicked', () => {
    const [{ getByText, queryByText }] = render()

    const timestampBreadcrumb = getByText('10/21/2021 08:00:09')
    timestampBreadcrumb.click()
    expect(queryByText('path matched')).toBeFalsy()
  })

  it('goes to the correct path when an inactive breadcrumb is clicked', () => {
    const [{ getByText }] = render()

    const protocolRunsBreadcrumb = getByText('Protocol Runs')
    protocolRunsBreadcrumb.click()
    getByText('path matched')
  })
})
