import React from 'react'
import { shallow } from 'enzyme'
import { mountWithProviders } from '@opentrons/components'

import { Page } from '../../../atoms/Page'
import { i18n } from '../../../i18n'
import { Network } from '../Network'
import { NetworkSettingsCard } from '../NetworkSettingsCard'

import type { State, Action } from '../../../redux/types'

const MOCK_STATE: State = { mockState: true } as any

describe('/more/network page component', () => {
  const render = () => {
    return mountWithProviders<
      React.ComponentProps<typeof Network>,
      State,
      Action
    >(<Network />, {
      initialState: MOCK_STATE,
      i18n,
    })
  }

  it('should render a Page with the correct title', () => {
    const { wrapper } = render()
    expect(wrapper.find(Page).prop('titleBarProps')).toEqual({
      title: 'Network',
    })
  })

  it('renders a NetworkSettingsCard', () => {
    const wrapper = shallow(<Network />)
    expect(wrapper.find(NetworkSettingsCard)).toHaveLength(1)
  })
})
