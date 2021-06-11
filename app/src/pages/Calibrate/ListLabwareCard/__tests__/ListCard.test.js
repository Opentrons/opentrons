// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import ListCard from '../ListCard'

describe('LabwareList', () => {
  test('component renders', () => {
    const tree = shallow(<ListCard />)

    expect(tree).toMatchSnapshot()
  })

  test('renders its children in a <ul>', () => {
    const tree = shallow(
      <ListCard>
        <li>a</li>
        <li>b</li>
      </ListCard>
    )

    expect(tree.find('ul')).toHaveLength(1)
    expect(tree.find('ul').find('li')).toHaveLength(2)
  })
})
