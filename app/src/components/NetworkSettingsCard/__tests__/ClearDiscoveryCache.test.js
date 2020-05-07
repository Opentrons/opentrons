// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { LabeledButton } from '@opentrons/components'
import { ClearDiscoveryCache } from '../ClearDiscoveryCache'

describe('ClearDiscoveryCache', () => {
  it('renders clear discovery cache component', () => {
    const wrapper = shallow(<ClearDiscoveryCache />)
    expect(wrapper.find(LabeledButton).prop('label')).toBe(
      'Clear Discovered Robots List'
    )
  })
})
