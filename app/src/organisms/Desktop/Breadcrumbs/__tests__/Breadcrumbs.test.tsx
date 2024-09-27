import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { when } from 'vitest-when'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { fireEvent, screen } from '@testing-library/react'

import { i18n } from '/app/i18n'
import { useRunCreatedAtTimestamp } from '/app/resources/runs'
import { useRobot } from '/app/redux-resources/robots'
import { getProtocolDisplayName } from '/app/transformations/protocols'
import { getIsOnDevice } from '/app/redux/config'
import { renderWithProviders } from '/app/__testing-utils__'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import { getStoredProtocol } from '/app/redux/protocol-storage'
import { storedProtocolData as storedProtocolDataFixture } from '/app/redux/protocol-storage/__fixtures__'
import { Breadcrumbs } from '..'

import type { State } from '/app/redux/types'

vi.mock('/app/resources/runs')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/transformations/protocols')
vi.mock('/app/redux/config')
vi.mock('/app/redux/protocol-storage')

const ROBOT_NAME = 'otie'
const RUN_ID = '95e67900-bc9f-4fbf-92c6-cc4d7226a51b'
const CREATED_AT = '03/03/2022 19:08:49'
const PROTOCOL_KEY = 'a0d8f8b2-ad20-4d5d-bad5-4abd51779654'
const PROTOCOL_NAME = 'a protocol for otie'

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Routes>
        <Route
          path="/devices/:robotName"
          element={
            <>
              <Breadcrumbs />
              <div>device details path matched</div>
            </>
          }
        />

        <Route
          path="/devices/:robotName/protocol-runs/:runId"
          element={
            <>
              <Breadcrumbs />
              <div>protocol run details path matched</div>
            </>
          }
        />

        <Route
          path="/protocols/:protocolKey"
          element={
            <>
              <Breadcrumbs />
              <div>protocol details path matched</div>
            </>
          }
        />
      </Routes>
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
