import React from 'react'
import { shallow } from 'enzyme'
import { mountWithProviders } from '@opentrons/components'

import { Page } from '../../../atoms/Page'
import { i18n } from '../../../i18n'
import * as SystemInfo from '../../../redux/system-info'
import { NetworkSettingsCard } from '../NetworkSettingsCard'
import { SystemInfoCard } from '../SystemInfoCard'
import { NetworkAndSystem } from '../NetworkAndSystem'

import type { State, Action } from '../../../redux/types'

jest.mock('../../../redux/system-info/selectors')

const MOCK_STATE: State = { mockState: true } as any

const getU2EAdapterDevice = SystemInfo.getU2EAdapterDevice as jest.MockedFunction<
  typeof SystemInfo.getU2EAdapterDevice
>

const getU2EWindowsDriverStatus = SystemInfo.getU2EWindowsDriverStatus as jest.MockedFunction<
  typeof SystemInfo.getU2EWindowsDriverStatus
>

function stubSelector<R>(
  mock: jest.MockedFunction<(s: State) => R>,
  rVal: R
): void {
  mock.mockImplementation(state => {
    expect(state).toBe(MOCK_STATE)
    return rVal
  })
}

describe('/more/network-and-system page component', () => {
  const render = () => {
    return mountWithProviders<
      React.ComponentProps<typeof NetworkAndSystem>,
      State,
      Action
    >(<NetworkAndSystem />, {
      initialState: MOCK_STATE,
      i18n,
    })
  }

  beforeEach(() => {
    stubSelector(getU2EAdapterDevice, null)
    stubSelector(getU2EWindowsDriverStatus, SystemInfo.NOT_APPLICABLE)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a Page with the correct title', () => {
    const { wrapper } = render()
    expect(wrapper.find(Page).prop('titleBarProps')).toEqual({
      title: 'Network & System',
    })
  })

  it('renders a NetworkSettingsCard', () => {
    const wrapper = shallow(<NetworkAndSystem />)
    expect(wrapper.find(NetworkSettingsCard)).toHaveLength(1)
  })

  it('renders a SystemInfoCard', () => {
    const wrapper = shallow(<NetworkAndSystem />)
    expect(wrapper.find(SystemInfoCard)).toHaveLength(1)
  })
})
