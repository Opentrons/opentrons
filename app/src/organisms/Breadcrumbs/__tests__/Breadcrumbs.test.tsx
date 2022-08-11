import * as React from 'react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import { when } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  useRobot,
  useRunCreatedAtTimestamp,
} from '../../../organisms/Devices/hooks'
import { getIsOnDevice } from '../../../redux/config'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { getStoredProtocol } from '../../../redux/protocol-storage'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { Breadcrumbs } from '..'

jest.mock('../../../organisms/Devices/hooks')
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

const ROBOT_NAME = 'otie'
const RUN_ID = '95e67900-bc9f-4fbf-92c6-cc4d7226a51b'
const CREATED_AT = '03/03/2022 19:08:49'

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Breadcrumbs />
      <Switch>
        <Route exact path="/devices/otie">
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
  beforeEach(() => {
    when(mockUseRobot)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(mockConnectableRobot)
    when(mockUseRunCreatedAtTimestamp)
      .calledWith(RUN_ID)
      .mockReturnValue(CREATED_AT)
    when(mockGetStoredProtocol).mockReturnValue(storedProtocolDataFixture)
    when(mockGetIsOnDevice).mockReturnValue(false)
  })
  it('renders an array of breadcrumbs', () => {
    const [{ getByText }] = render()

    getByText('Devices')
    getByText('otie')
    getByText('10/21/2021 08:00:09')
  })

  it('does nothing when the active breadcrumb is clicked', () => {
    const [{ getByText, queryByText }] = render()

    const timestampBreadcrumb = getByText('10/21/2021 08:00:09')
    timestampBreadcrumb.click()
    expect(queryByText('path matched')).toBeFalsy()
  })

  it('goes to the correct path when an inactive breadcrumb is clicked', () => {
    const [{ getByText }] = render()

    const otieBreadcrumb = getByText('otie')
    otieBreadcrumb.click()
    getByText('path matched')
  })
})
