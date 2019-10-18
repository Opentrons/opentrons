// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import AddLabwareCard from '..'

describe('AddLabwareCard', () => {
  test('component renders', () => {
    const tree = shallow(<AddLabwareCard />)

    expect(tree).toMatchSnapshot()
  })
})
