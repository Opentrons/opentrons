// @flow
// LabwareGuide component tests
import { shallow } from 'enzyme'
import * as React from 'react'

import { LabwareGuide } from '../LabwareGuide'

describe('LabwareGuide', () => {
  it('component renders', () => {
    const tree = shallow(<LabwareGuide />)

    expect(tree).toMatchSnapshot()
  })
})
