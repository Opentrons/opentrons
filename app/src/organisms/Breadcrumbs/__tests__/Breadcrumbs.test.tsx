import * as React from 'react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import { when } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { fireEvent, screen } from '@testing-library/react'

import { i18n } from '../../../i18n'
import {
  useRobot,
  useRunCreatedAtTimestamp,
} from '../../../organisms/Devices/hooks'
import { getProtocolDisplayName } from '../../../organisms/ProtocolsLanding/utils'
import { getIsOnDevice } from '../../../redux/config'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { getStoredProtocol } from '../../../redux/protocol-storage'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { Breadcrumbs } from '..'

import type { State } from '../../../redux/types'

jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../organisms/ProtocolsLanding/utils')
jest.mock('../../../redux/config')
jest.mock('../../../redux/protocol-storage')

const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockUseRunCreatedAtTimestamp = useRunCreatedAtTimestamp as jest.MockedFunction<
  typeof useRunCreatedAtTimestamp
>
const mockGetStoredProtocol = getStoredProtocol as jest.MockedFunction<
  typeof getStoredProtocol
>
const mockGetIsOnDevice = getIsOnDevice as jest.MockedFunction<
  typeof getIsOnDevice
>
const mockGetProtocolDisplayName = getProtocolDisplayName as jest.MockedFunction<
  typeof getProtocolDisplayName
>

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
    when(mockUseRobot)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(mockConnectableRobot)
    when(mockUseRunCreatedAtTimestamp)
      .calledWith(RUN_ID)
      .mockReturnValue(CREATED_AT)
    when(mockGetStoredProtocol)
      .calledWith({} as State, PROTOCOL_KEY)
      .mockReturnValue(storedProtocolDataFixture)
    when(mockGetIsOnDevice)
      .calledWith({} as State)
      .mockReturnValue(false)
    when(mockGetProtocolDisplayName)
      .calledWith(
        storedProtocolDataFixture.protocolKey,
        storedProtocolDataFixture.srcFileNames,
        storedProtocolDataFixture.mostRecentAnalysis
      )
      .mockReturnValue(PROTOCOL_NAME)
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
    when(mockGetIsOnDevice)
      .calledWith({} as State)
      .mockReturnValue(true)
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
