// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { Card } from '@opentrons/components'
import { AddManualIp } from '../AddManualIp'
import { ClearDiscoveryCache } from '../ClearDiscoveryCache'
import { DisableDiscoveryCache } from '../DisableDiscoveryCache'
import { NetworkSettingsCard } from '..'

describe('NetworkSettingsCard', () => {
  it('should render a card with the proper title', () => {
    const wrapper = shallow(<NetworkSettingsCard />)
    expect(wrapper.find(Card).prop('title')).toBe('Network Settings')
  })

  it('should render an AddManualIp setting component', () => {
    const wrapper = shallow(<NetworkSettingsCard />)
    expect(wrapper.exists(AddManualIp)).toBe(true)
  })

  it('should render a ClearDiscoveryCache component', () => {
    const wrapper = shallow(<NetworkSettingsCard />)
    expect(wrapper.exists(ClearDiscoveryCache)).toBe(true)
  })

  it('should render a DisableDiscoveryCache component', () => {
    const wrapper = shallow(<NetworkSettingsCard />)
    expect(wrapper.exists(DisableDiscoveryCache)).toBe(true)
  })
})
