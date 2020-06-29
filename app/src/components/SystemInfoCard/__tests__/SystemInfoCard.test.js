// @flow
import { Card } from '@opentrons/components'
import { shallow } from 'enzyme'
import * as React from 'react'

import { SystemInfoCard } from '..'
import { U2EAdapterInfo } from '../U2EAdapterInfo'

jest.mock('../U2EAdapterInfo', () => ({
  U2EAdapterInfo: () => <></>,
}))

describe('SystemInfoCard', () => {
  it('should render a card with the proper title', () => {
    const wrapper = shallow(<SystemInfoCard />)
    expect(wrapper.find(Card).prop('title')).toBe('System Information')
  })

  it('should render a U2EAdapterInfo component', () => {
    const wrapper = shallow(<SystemInfoCard />)
    expect(wrapper.find(U2EAdapterInfo)).toHaveLength(1)
  })
})
