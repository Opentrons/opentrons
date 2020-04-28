// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { Card } from '@opentrons/components'
import { AddManualIp } from '../AddManualIp'
import { NetworkSettingsCard } from '..'

describe('NetworkSettingsCard', () => {
  it('should render a card with the proper title', () => {
    const wrapper = shallow(<NetworkSettingsCard />)
    expect(wrapper.find(Card).prop('title')).toBe('Network Settings')
  })

  it('should render an AddManualIp setting component', () => {
    const wrapper = shallow(<NetworkSettingsCard />)
    expect(wrapper.find(AddManualIp)).toHaveLength(1)
  })
})
