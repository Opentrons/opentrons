// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import ListLabwareCard from '..'

describe('ListLabwareCard', () => {
  test('component renders', () => {
    const tree = shallow(<ListLabwareCard />)

    expect(tree).toMatchSnapshot()
  })
})
