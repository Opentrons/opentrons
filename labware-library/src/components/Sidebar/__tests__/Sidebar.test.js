// @flow
// Sidebar component tests
import * as React from 'react'
import { shallow } from 'enzyme'

import { Sidebar } from '..'

jest.mock('../../../definitions')

describe('Sidebar', () => {
  const filters = { category: 'all', manufacturer: 'all' }

  test('component renders', () => {
    const tree = shallow(<Sidebar filters={filters} />)

    expect(tree).toMatchSnapshot()
  })

  test('renders a <nav>', () => {
    const tree = shallow(<Sidebar filters={filters} />)

    expect(tree.find('nav')).toHaveLength(1)
  })
})
