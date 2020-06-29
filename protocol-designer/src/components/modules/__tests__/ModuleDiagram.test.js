// @flow

import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V2,
} from '@opentrons/shared-data'
import { shallow } from 'enzyme'
import React from 'react'

import { ModuleDiagram } from '../ModuleDiagram'

describe('ModuleDiagram', () => {
  it('displays a module diagram based on module type and model', () => {
    const props = {
      type: MAGNETIC_MODULE_TYPE,
      model: MAGNETIC_MODULE_V2,
    }

    const wrapper = shallow(<ModuleDiagram {...props} />)

    expect(wrapper.find('img').prop('src')).toBe('magdeck_gen2.png')
  })
})
