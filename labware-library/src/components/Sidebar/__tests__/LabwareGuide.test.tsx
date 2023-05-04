// LabwareGuide component tests
import { LabwareGuide } from '../LabwareGuide'
import { shallow } from 'enzyme'
import * as React from 'react'

describe('LabwareGuide', () => {
  it('component renders', () => {
    const tree = shallow(<LabwareGuide />)

    expect(tree).toMatchSnapshot()
  })
})
