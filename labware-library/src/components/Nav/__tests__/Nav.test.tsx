// tests for top navbar
import { Nav } from '..'
import { shallow } from 'enzyme'
import * as React from 'react'

describe('Nav', () => {
  it('component renders', () => {
    const tree = shallow(<Nav />)

    expect(tree).toMatchSnapshot()
  })
})
