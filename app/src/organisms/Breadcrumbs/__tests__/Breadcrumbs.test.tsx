import * as React from 'react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import { when } from 'vitest-when'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { fireEvent, screen } from '@testing-library/react'

import { i18n } from '../../../i18n'
import {
  useRobot,
  useRunCreatedAtTimestamp,
} from '../../../organisms/Devices/hooks'
import { getProtocolDisplayName } from '../../../organisms/ProtocolsLanding/utils'
import { getIsOnDevice } from '../../../redux/config'
import { renderWithProviders } from '../../../__testing-utils__'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { getStoredProtocol } from '../../../redux/protocol-storage'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { Breadcrumbs } from '..'

import type { State } from '../../../redux/types'

vi.mock('../../../organisms/Devices/hooks')
vi.mock('../../../organisms/ProtocolsLanding/utils')
vi.mock('../../../redux/config')
vi.mock('../../../redux/protocol-storage')

const ROBOT_NAME = 'otie'
const RUN_ID = '95e67900-bc9f-4fbf-92c6-cc4d7226a51b'
const CREATED_AT = '03/03/2022 19:08:49'
const PROTOCOL_KEY = 'a0d8f8b2-ad20-4d5d-bad5-4abd51779654'
const PROTOCOL_NAME = 'a protocol for otie'

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Switch>
        <Route exact path="/devices/:robotName">
          <Breadcrumbs />
          <div>device details path matched</div>
        </Route>
        <Route exact path="/devices/:robotName/protocol-runs/:runId">
          <Breadcrumbs />
          <div>protocol run details path matched</div>
        </Route>
        <Route exact path="/protocols/:protocolKey">
          <Breadcrumbs />
          <div>protocol details path matched</div>
        </Route>
      </Switch>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Breadcrumbs', () => {
  beforeEach(() => {
    when(useRobot).calledWith(ROBOT_NAME).thenReturn(mockConnectableRobot)
    when(useRunCreatedAtTimestamp).calledWith(RUN_ID).thenReturn(CREATED_AT)
    when(getStoredProtocol)
      .calledWith({} as State, PROTOCOL_KEY)
      .thenReturn(storedProtocolDataFixture)
    when(getIsOnDevice)
      .calledWith({} as State)
      .thenReturn(false)
    when(getProtocolDisplayName)
      .calledWith(
        storedProtocolDataFixture.protocolKey,
        storedProtocolDataFixture.srcFileNames,
        storedProtocolDataFixture.mostRecentAnalysis
      )
      .thenReturn(PROTOCOL_NAME)
  })
  it('renders an array of device breadcrumbs', () => {
    render(`/devices/${ROBOT_NAME}/protocol-runs/${RUN_ID}`)
    screen.getByText('Devices')
    screen.getByText('otie')
    screen.getByText(CREATED_AT)
  })

  it('renders an array of protocol breadcrumbs', () => {
    render(`/protocols/${PROTOCOL_KEY}`)
    screen.getByText('Protocols')
    screen.getByText(PROTOCOL_NAME)
  })

  it('does not render devices breadcrumb when in on device mode', () => {
    when(getIsOnDevice)
      .calledWith({} as State)
      .thenReturn(true)
    render(`/devices/${ROBOT_NAME}/protocol-runs/${RUN_ID}`)
    expect(screen.queryByText('Devices')).toBeNull()
    screen.getByText('otie')
    screen.getByText(CREATED_AT)
  })

  it('goes to the correct path when an inactive breadcrumb is clicked', () => {
    render(`/devices/${ROBOT_NAME}/protocol-runs/${RUN_ID}`)
    screen.getByText('protocol run details path matched')
    const otieBreadcrumb = screen.getByText('otie')
    fireEvent.click(otieBreadcrumb)
    screen.getByText('device details path matched')
  })
})
